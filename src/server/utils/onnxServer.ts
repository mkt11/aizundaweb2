/* -------------------------------------------------------------------------
   HuBERT-int8  +  PM-F0  +  RVC-v2（ONNX）推論サーバ   –  完全版
   -------------------------------------------------------------------------
   1. 16 kHz PCM  →  HuBERT 特徴 (768 d)  →  2× 補間
   2. 16 kHz PCM  →  Pitch-mark 法で F0 推定
   3. transpose 半音だけ F0 シフト               (–24 … +24)
   4. RVC-v2 (float16) へ特徴＋F0 を入力          →  40 kHz 音声
   5. WAV (int16 RIFF) で返却
   ------------------------------------------------------------------------- */

   import path from "path";
   import fs   from "fs";
   import * as ort from "onnxruntime-node";
   import { decodeWav, encodeWav } from "./audio";
   
   /* ───────────── モデル配置 ───────────── */
   const MODEL_DIR      = path.join(process.cwd(), "server_model");
   const HUBERT_INT8    = path.join(MODEL_DIR, "hubert_base.onnx");  // ★量子化版
   const RVC_ONNX       = path.join(MODEL_DIR, "tsukuyomi-chan.onnx");
   
   /* ───────────── セッションキャッシュ ───────────── */
   let hubertSession: ort.InferenceSession | null = null;
   let rvcSession   : ort.InferenceSession | null = null;
   
   /** HuBERT (INT8, CPU) */
   async function getHubertSession(): Promise<ort.InferenceSession> {
     if (!hubertSession) {
       if (!fs.existsSync(HUBERT_INT8)) {
         throw new Error(`HuBERT model not found: ${HUBERT_INT8}`);
       }
       hubertSession = await ort.InferenceSession.create(HUBERT_INT8, {
         executionProviders: ["cpu"],          // INT8 演算は CPU のみサポート
         graphOptimizationLevel: "all",
       });
       console.log("[getHubertSession] ready:", hubertSession.inputNames, "→", hubertSession.outputNames);
     }
     return hubertSession;
   }
   
   /** RVC-v2 (float16, CPU) */
   async function getRvcSession(): Promise<ort.InferenceSession> {
     if (!rvcSession) {
       if (!fs.existsSync(RVC_ONNX)) {
         throw new Error(`RVC model not found: ${RVC_ONNX}`);
       }
       rvcSession = await ort.InferenceSession.create(RVC_ONNX, {
         executionProviders: ["cpu"],
         graphOptimizationLevel: "all",
       });
       console.log("[getRvcSession] ready:", rvcSession.inputNames, "→", rvcSession.outputNames);
     }
     return rvcSession;
   }
   
   /* ───────────── 便利関数：線形リサンプル ───────────── */
   function resampleLinear(src: Float32Array, from: number, to: number): Float32Array {
     if (from === to) return src;
     const ratio = to / from;
     const L     = Math.round(src.length * ratio);
     const out   = new Float32Array(L);
     for (let i = 0; i < L; ++i) {
       const x  = i / ratio;
       const i0 = Math.floor(x);
       const i1 = Math.min(i0 + 1, src.length - 1);
       const w  = x - i0;
       out[i]   = src[i0] * (1 - w) + src[i1] * w;
     }
     return out;
   }
   
   /* ───────────── Float16 → Float32 変換 ───────────── */
   function halfToFloat32(h: Uint16Array): Float32Array {
     const f32 = new Float32Array(h.length);
     for (let i = 0; i < h.length; ++i) {
       const v = h[i];
       const s = (v & 0x8000) >> 15;
       const e = (v & 0x7C00) >> 10;
       const m =  v & 0x03FF;
       let val: number;
       if (e === 0) {
         val = (m === 0) ? 0 : (m / 0x400) * 2 ** (-14);
       } else if (e === 0x1F) {
         val = m ? NaN : Infinity;
       } else {
         val = (1 + m / 0x400) * 2 ** (e - 15);
       }
       f32[i] = s ? -val : val;
     }
     return f32;
   }
   
   /* ───────────── PitchMark F0 推定 (10 ms frame) ───────────── */
   function extractPitchPm(pcm: Float32Array, sr = 16000): Float32Array {
     const hop   = Math.floor(sr * 0.010);
     const frame = 512;
     const nfrm  = Math.floor(pcm.length / hop);
     const f0Arr = new Float32Array(nfrm);
   
     for (let i = 0; i < nfrm; ++i) {
       const c      = i * hop + (hop >> 1);
       const left   = Math.max(0, c - frame);
       const right  = Math.min(pcm.length, c + frame);
       const seg    = pcm.subarray(left, right);
       f0Arr[i]     = pitchOne(seg, sr, 50, 500);
     }
     return f0Arr;
   }
   
   function pitchOne(seg: Float32Array, sr: number, fMin: number, fMax: number): number {
     const lagMin = Math.floor(sr / fMax);
     const lagMax = Math.floor(sr / fMin);
     let bestLag  = lagMin, bestR = -1;
   
     for (let lag = lagMin; lag <= lagMax; ++lag) {
       let r = 0;
       for (let i = 0; i + lag < seg.length; ++i) r += seg[i] * seg[i + lag];
       if (r > bestR) { bestR = r; bestLag = lag; }
     }
   
     // パラボラ補完
     const r0 = autoCorr(seg, bestLag - 1);
     const r1 = bestR;
     const r2 = autoCorr(seg, bestLag + 1);
     const denom = 2 * (r0 - 2 * r1 + r2);
     const delta = denom === 0 ? 0 : (r0 - r2) / denom;
   
     return sr / (bestLag + delta);
   }
   
   function autoCorr(seg: Float32Array, lag: number): number {
     let r = 0;
     for (let i = 0; i + lag < seg.length; ++i) r += seg[i] * seg[i + lag];
     return r;
   }
   
   /* ───────────── メイン推論関数 ───────────── */
   export async function inferRvc(
     wavBytes: Uint8Array,
     transpose: number = 0,         // –24 … +24 半音
   ): Promise<Uint8Array> {
   
     /* 0. WAV → PCM 16 kHz */
     const { pcm, sampleRate } = await decodeWav(wavBytes);
     const pcm16 = sampleRate === 16000 ? pcm : resampleLinear(pcm, sampleRate, 16000);
   
     /* 1. HuBERT 特徴抽出（INT8 モデル） */
     const hubert = await getHubertSession();
     const { data: feat0, dims: d0 } = await extractHubertFeatures(pcm16, hubert);
     const { data: feats,  dims: d1 } = interpolate2x(feat0, d0);  // 2 倍補間
   
     /* 2. PitchMark F0 推定 (+ 変調) */
     const f0Arr = extractPitchPm(pcm16);
     if (transpose !== 0) {
       const f = 2 ** (transpose / 12);
       for (let i = 0; i < f0Arr.length; ++i) f0Arr[i] *= f;
     }
   
     /* 3. F0 → coarse (1–255) 量子化 */
     const coarse = new BigInt64Array(f0Arr.length);
     const fMin = 50, fMax = 500;
     for (let i = 0; i < f0Arr.length; ++i) {
       const f = Math.max(fMin, Math.min(fMax, f0Arr[i]));
       const n = (Math.log2(f) - Math.log2(fMin)) / (Math.log2(fMax) - Math.log2(fMin));
       coarse[i] = BigInt(Math.round(n * 254) + 1);
     }
   
     /* 4. RVC-v2 推論 */
     const rvc   = await getRvcSession();
     const raw   = await runRvc(feats, d1, f0Arr, coarse, rvc);
   
     /* 5. 40 kHz WAV エンコード */
     const pcm40 = raw instanceof Uint16Array ? halfToFloat32(raw) : raw;
     return encodeWav(pcm40, 40000);
   }
   
   /* ───────────── HuBERT 抽出 ───────────── */
   async function extractHubertFeatures(
     pcm: Float32Array,
     sess: ort.InferenceSession,
   ): Promise<{ data: Float32Array; dims: [number, number, number] }> {
   
     const N = pcm.length;
     const src  = new ort.Tensor("float32", pcm, [1, N]);         // 1×N
     const mask = new ort.Tensor("bool",    new Uint8Array(N), [1, N]);
   
     const out  = await sess.run({ source: src, padding_mask: mask });
     const t    = out[sess.outputNames[0]] as ort.Tensor;
     return { data: t.data as Float32Array, dims: t.dims as [number, number, number] };
   }
   
   /* ───────────── 2× 時間方向補間 ───────────── */
   function interpolate2x(
     feats: Float32Array,
     dims : [number, number, number],
   ): { data: Float32Array; dims: [number, number, number] } {
   
     const [B, T, C] = dims;
     const out = new Float32Array(B * T * 2 * C);
   
     for (let b = 0; b < B; ++b) {
       for (let t = 0; t < T; ++t) {
         const offsIn  = b * T     * C + t * C;
         const offsOut = b * T * 2 * C + (t * 2) * C;
         out.set(feats.subarray(offsIn, offsIn + C), offsOut);     // original
         out.set(feats.subarray(offsIn, offsIn + C), offsOut + C); // duplicate
       }
     }
     return { data: out, dims: [B, T * 2, C] };
   }
   
   /* ───────────── RVC-v2 推論 ───────────── */
   async function runRvc(
     feats      : Float32Array,
     dims       : [number, number, number],
     f0Arr      : Float32Array,
     coarseArr  : BigInt64Array,
     sess       : ort.InferenceSession,
   ): Promise<Float32Array | Uint16Array> {
   
     const [B, T, C] = dims;
   
     // --- pitch / pitchf を T フレームにパディング ---
     const pad = <T>(arr: T[], len: number, fill: T): T[] =>
       arr.length >= len ? arr.slice(0, len) : [...arr, ...Array(len - arr.length).fill(fill)];
   
     const coarsePad = pad(Array.from(coarseArr), T, coarseArr[coarseArr.length - 1]);
     const f0Pad     = pad(Array.from(f0Arr),    T, f0Arr[f0Arr.length - 1]);
   
     // --- feats → float16 ---
     const feats16 = new Uint16Array(feats.length);
     for (let i = 0; i < feats.length; ++i) {
       feats16[i] = float32ToHalf(feats[i]);
     }
   
     // --- Tensor 化 ---
     const feeds: Record<string, ort.Tensor> = {};
     for (const name of sess.inputNames) {
       switch (name) {
         case "feats":
           feeds[name] = new ort.Tensor("float16", feats16, [B, T, C]); break;
         case "p_len":
           feeds[name] = new ort.Tensor("int64",  BigInt64Array.from([BigInt(T)]), [1]); break;
         case "sid":
           feeds[name] = new ort.Tensor("int64",  BigInt64Array.from([0n]), [1]); break;
         case "pitch":
           feeds[name] = new ort.Tensor("int64",  BigInt64Array.from(coarsePad), [B, T]); break;
         case "pitchf":
           feeds[name] = new ort.Tensor("float32", Float32Array.from(f0Pad),    [B, T]); break;
         default:
           throw new Error(`Unexpected input: ${name}`);
       }
     }
   
     const outMap = await sess.run(feeds);
     const tensor = outMap[sess.outputNames[0]] as ort.Tensor;
     return tensor.data as Float32Array | Uint16Array;
   }
   
   /* ───────────── Float32 → Float16 (bitpack) ───────────── */
   function float32ToHalf(val: number): number {
     if (isNaN(val))  return 0x7E00;
     if (!isFinite(val)) return val < 0 ? 0xFC00 : 0x7C00;
   
     const s = val < 0 ? 1 : 0;
     const a = Math.abs(val);
     if (a === 0) return s << 15;
   
     let e = Math.floor(Math.log2(a));
     let m = a / 2 ** e - 1;
     e += 15;
     if (e <= 0)  return s << 15;         // denorm → 0
     if (e >= 31) return (s << 15) | 0x7C00; // overflow → inf
   
     m = Math.round(m * 1024);
     if (m === 1024) { m = 0; ++e; }
     return (s << 15) | (e << 10) | (m & 0x3FF);
   }
   