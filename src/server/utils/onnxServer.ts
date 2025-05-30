// src/server/utils/onnxServer.ts

import path from 'path'
import fs   from 'fs'
import * as ort from 'onnxruntime-node'
import { decodeWav, encodeWav } from './audio'

// ────────────────
// モデル配置
// ────────────────
const MODEL_DIR   = path.join(process.cwd(), 'server_model')
const HUBERT_ONNX = path.join(MODEL_DIR, 'hubert_base.onnx')
const RVC_ONNX    = path.join(MODEL_DIR, 'tsukuyomi-chan.onnx')

// ────────────────
// セッションキャッシュ
// ────────────────
let hubertSession: ort.InferenceSession | null = null
let rvcSession:    ort.InferenceSession | null = null

async function getHubertSession(): Promise<ort.InferenceSession> {
  if (!hubertSession) {
    if (!fs.existsSync(HUBERT_ONNX)) throw new Error(`HuBERT model not found: ${HUBERT_ONNX}`)
    hubertSession = await ort.InferenceSession.create(HUBERT_ONNX, { executionProviders: ['cpu'] })
  }
  return hubertSession
}

async function getRvcSession(): Promise<ort.InferenceSession> {
  if (!rvcSession) {
    if (!fs.existsSync(RVC_ONNX)) throw new Error(`RVC model not found: ${RVC_ONNX}`)
    rvcSession = await ort.InferenceSession.create(RVC_ONNX, { executionProviders: ['cpu'] })
  }
  return rvcSession
}

// ────────────────
// 線形リサンプリング
// ────────────────
function resampleLinear(src: Float32Array, fromRate: number, toRate: number): Float32Array {
  const ratio = toRate / fromRate
  const L     = Math.round(src.length * ratio)
  const out   = new Float32Array(L)
  for (let i = 0; i < L; i++) {
    const x  = i / ratio
    const i0 = Math.floor(x)
    const i1 = Math.min(i0 + 1, src.length - 1)
    const w  = x - i0
    out[i]   = src[i0] * (1 - w) + src[i1] * w
  }
  return out
}

// ────────────────
// half precision → Float32Array
// ────────────────
function halfToFloat32(half: Uint16Array): Float32Array {
  const out = new Float32Array(half.length)
  for (let i = 0; i < half.length; i++) {
    const h = half[i]
    const s = (h & 0x8000) >> 15
    const e = (h & 0x7C00) >> 10
    const m = h & 0x03FF
    if (e === 0) out[i] = (s ? -1 : 1) * 2**(-14) * (m / 1024)
    else if (e === 0x1F) out[i] = m ? NaN : ((s ? -1 : 1) * Infinity)
    else           out[i] = (s ? -1 : 1) * 2**(e - 15) * (1 + m / 1024)
  }
  return out
}

// ────────────────
// PM アルゴリズムでピッチ推定
// ────────────────
function extractPitchPm(pcm: Float32Array, sr: number): Float32Array {
  const hop = Math.floor(sr * 0.010)  // 10ms
  const frames = Math.floor(pcm.length / hop)
  const f0 = new Float32Array(frames)
  for (let i = 0; i < frames; i++) {
    const c = i * hop + Math.floor(hop / 2)
    const start = Math.max(0, c - 512)
    const end   = Math.min(pcm.length, c + 512)
    f0[i]       = estimatePitchPmSegment(pcm.subarray(start, end), sr, 50, 500)
  }
  return f0
}

function estimatePitchPmSegment(seg: Float32Array, sr: number, minF: number, maxF: number): number {
  const minLag = Math.floor(sr / maxF), maxLag = Math.floor(sr / minF)
  let bestLag = minLag, bestR = -Infinity
  for (let lag = minLag; lag <= maxLag; lag++) {
    let r = 0
    for (let j = 0; j + lag < seg.length; j++) r += seg[j] * seg[j + lag]
    if (r > bestR) { bestR = r; bestLag = lag }
  }
  const r0 = autocorr(seg, bestLag - 1)
  const r2 = autocorr(seg, bestLag + 1)
  const denom = 2 * (r0 - 2 * bestR + r2)
  const delta = denom === 0 ? 0 : (r0 - r2) / denom
  return sr / (bestLag + delta)
}
function autocorr(seg: Float32Array, lag: number): number {
  let r = 0
  for (let i = 0; i + lag < seg.length; i++) r += seg[i] * seg[i + lag]
  return r
}

// ────────────────
// メイン：WAV → RVC → WAV
// ────────────────
export async function inferRvc(
  wavBytes: Uint8Array,
  semitone: number = 0
): Promise<Uint8Array> {
  // decode & resample
  const { pcm: raw, sampleRate } = await decodeWav(wavBytes)
  const pcm16 = sampleRate === 16000 ? raw : resampleLinear(raw, sampleRate, 16000)

  // 1) HuBERT 特徴量
  const hubert = await getHubertSession()
  const { data: f0_feats0, dims: dims0 } = await extractFeatures(pcm16, hubert)
  const { data: feats, dims }            = interpolateFeats(f0_feats0, dims0)

  // 2) PM で F0
  let f0Arr = extractPitchPm(pcm16, 16000)
  if (semitone) {
    const factor = 2**(semitone / 12)
    for (let i = 0; i < f0Arr.length; i++) f0Arr[i] *= factor
  }

  // 3) coarse 量子化 → int64
  const minF=50, maxF=500
  const coarse = new BigInt64Array(f0Arr.length)
  for (let i = 0; i < f0Arr.length; i++) {
    const c = Math.max(minF, Math.min(maxF, f0Arr[i]))
    const n = (Math.log2(c) - Math.log2(minF)) / (Math.log2(maxF) - Math.log2(minF))
    coarse[i] = BigInt(Math.round(n * 254) + 1)
  }

  // 4) RVC 推論
  const rvc = await getRvcSession()
  const rawOut = await runRvc(feats, dims, f0Arr, coarse, rvc)

  // 5) WAV 化
  const pcmOut = rawOut instanceof Uint16Array ? halfToFloat32(rawOut) : rawOut
  return encodeWav(pcmOut, 40000)
}

// ────────────────
// 補助：HuBERT 抽出
// ────────────────
async function extractFeatures(
  pcm: Float32Array,
  sess: ort.InferenceSession
): Promise<{ data: Float32Array; dims: [number,number,number] }> {
  const N = pcm.length
  const src  = new ort.Tensor('float32', pcm, [1, N])
  const mask = new ort.Tensor('bool',    new Uint8Array(N), [1, N])
  const out  = await sess.run({ source: src, padding_mask: mask })
  const t    = out[sess.outputNames[0]] as ort.Tensor
  return { data: t.data as Float32Array, dims: t.dims as [number,number,number] }
}

// ────────────────
// 補助：2 倍補間
// ────────────────
function interpolateFeats(
  feats: Float32Array,
  dims: [number,number,number]
): { data: Float32Array; dims: [number,number,number] } {
  const [B, T, C] = dims
  const newT      = T * 2
  const out       = new Float32Array(B * newT * C)
  for (let b = 0; b < B; b++) {
    for (let t = 0; t < T; t++) {
      for (let c = 0; c < C; c++) {
        const v = feats[b*T*C + t*C + c]
        const idx = b*newT*C + (2*t)*C + c
        out[idx]    = v
        out[idx+C]  = v
      }
    }
  }
  return { data: out, dims: [B,newT,C] }
}

// ────────────────
// 補助：RVC 実行
// ────────────────
async function runRvc(
  feats: Float32Array,
  dims: [number,number,number],
  f0Arr: Float32Array,
  coarseArr: BigInt64Array,
  sess: ort.InferenceSession
): Promise<Float32Array|Uint16Array> {
  const [B, T, C] = dims

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const padF0     = (arr: any[], len: number, fill: any) =>
    arr.length>len ? arr.slice(0,len) : [...arr, ...Array(len-arr.length).fill(fill)]
  const f0_adj    = padF0(Array.from(f0Arr),    T, f0Arr[f0Arr.length-1])
  const coarse_adj= padF0(Array.from(coarseArr),T, coarseArr[coarseArr.length-1])

  // feats→float16
  const feats16 = new Uint16Array(feats.length)
  for (let i = 0; i < feats.length; i++) {
    const x    = Math.fround(feats[i])
    const sbit = (x<0?1:0)<<15
    const a    = Math.abs(x)
    feats16[i]  = a===0? sbit
                 : isNaN(a)? sbit|0x7e00
                 : a===Infinity? sbit|0x7c00
                 : (()=>{ const e=Math.floor(Math.log2(a)), m0=a/2**e-1, e16=e+15
                     if(e16<=0) return sbit
                     if(e16>=31) return sbit|0x7c00
                     const m=Math.round(m0*1024)
                     return sbit|(e16<<10)|m
                   })()
  }

  // テンソル化
  const featsTensor  = new ort.Tensor('float16', feats16, [B, T, C])
  const plenTensor   = new ort.Tensor('int64',   BigInt64Array.from([BigInt(T)]), [1])
  const sidTensor    = new ort.Tensor('int64',   BigInt64Array.from([0n]),       [1])
  // ←ここを入れ替え  
  const pitchTensor  = new ort.Tensor('int64',   BigInt64Array.from(coarse_adj), [B, T])
  const pitchfTensor = new ort.Tensor('float32', Float32Array.from(f0_adj),     [B, T])

  // マッピング
  const feeds: Record<string, ort.Tensor> = {}
  for (const name of sess.inputNames) {
    if (name === 'feats')       feeds[name] = featsTensor
    else if (name === 'p_len')  feeds[name] = plenTensor
    else if (name === 'sid')    feeds[name] = sidTensor
    else if (name === 'pitch')  feeds[name] = pitchTensor   // int64
    else if (name === 'pitchf') feeds[name] = pitchfTensor  // float32
    else throw new Error(`Unexpected input name: ${name}`)
  }

  const outMap = await sess.run(feeds)
  const t      = outMap[sess.outputNames[0]] as ort.Tensor
  return t.data instanceof Uint16Array ? t.data : (t.data as Float32Array)
}
