// src/utils/onnxRuntimeClient.ts

import * as ort from 'onnxruntime-web';  // Wasm と WebGL の両方を含む公式パッケージ :contentReference[oaicite:0]{index=0}
import { loadAudio, pcmToWavBlob } from './audio';
import { highpassFilter } from './filters';

export type Provider = 'wasm' | 'webgl';

const HUBERT_MODEL = '/model/hubert_base.onnx';
const RVC_MODEL   = '/model/AISO-HOWATTO.onnx';

/**
 * 音声ファイルを RVC で変換し、Blob URL を返します。
 * @param file     入力オーディオファイル
 * @param setStatus ステータス更新関数
 * @param provider 'wasm' | 'webgl'
 */
export async function runPipeline(
  file: File,
  setStatus: (msg: string) => void,
  provider: Provider = 'wasm'
): Promise<string> {
  // 1. 音声読み込み
  setStatus('音声読み込み...');
  const pcm = await loadAudio(file);

  // 2. ポップノイズ除去
  setStatus('ポップノイズ除去...');
  const filtered = await highpassFilter(pcm, 16000);

  // 3. HuBERT 特徴抽出
  setStatus('HuBERT 特徴抽出...');
  const hubertSession = await createSession(HUBERT_MODEL, provider);
  const { data: featsData, dims: featsDims } = await extractFeatures(filtered, hubertSession);

  // 4. 特徴補間
  setStatus('特徴補間...');
  const interp = interpolateFeats(featsData, featsDims);

  // 5. RVC 推論
  setStatus('RVC 変換中...');
  const rvcSession = await createSession(RVC_MODEL, provider);
  const pcmOut = await runRVC(interp, rvcSession);

  // 6. WAV 生成
  setStatus('オーディオ生成...');
  const blob = pcmToWavBlob(pcmOut, 40000);
  return URL.createObjectURL(blob);
}

async function createSession(
  modelUrl: string,
  provider: Provider
): Promise<ort.InferenceSession> {
  // provider が 'webgl' のときのみ WebGL EP を試行、それ以外は Wasm EP
  if (provider === 'webgl') {
    try {
      return await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['webgl']
      });
    } catch (e) {
      console.warn(`WebGL backend の初期化に失敗したため Wasm にフォールバック: ${e}`);
    }
  }
  return await ort.InferenceSession.create(modelUrl, {
    executionProviders: ['wasm']
  });
}

async function extractFeatures(
  audio: Float32Array,
  session: ort.InferenceSession
): Promise<{ data: Float32Array; dims: number[] }> {
  const len = audio.length;
  const src   = new ort.Tensor('float32', audio, [1, len]);
  const mask  = new ort.Tensor('bool', new Uint8Array(len),   [1, len]);

  const outputMap = await session.run({ source: src, padding_mask: mask });
  const key  = Object.keys(outputMap)[0];
  const out  = outputMap[key] as ort.Tensor;
  return { data: out.data as Float32Array, dims: out.dims.slice() };
}

function interpolateFeats(
  data: Float32Array,
  dims: number[]
): Float32Array {
  const [B, T, C] = dims;
  const dst = new Float32Array(B * T * 2 * C);
  for (let b = 0; b < B; b++) {
    for (let t = 0; t < T; t++) {
      for (let c = 0; c < C; c++) {
        const v    = data[b * T * C + t * C + c];
        const base = b * (T * 2) * C + (t * 2) * C + c;
        dst[base]     = v;
        dst[base + C] = v;
      }
    }
  }
  return dst;
}

async function runRVC(
  feats: Float32Array,
  session: ort.InferenceSession,
  sid: number = 0
): Promise<Float32Array> {
  const T2 = feats.length / 256;
  const phone = new ort.Tensor('float32', feats, [1, T2, 256]);
  const phone_lengths = new ort.Tensor(
    'int64',
    new BigInt64Array([BigInt(T2)]),
    [1]
  );
  const ds = new ort.Tensor(
    'int64',
    new BigInt64Array([BigInt(sid)]),
    [1]
  );
  const rnd = new ort.Tensor(
    'float32',
    Float32Array.from({ length: 1 * 192 * T2 }, () => (Math.random() * 2 - 1) * 0.66666),
    [1, 192, T2]
  );

  const outputMap = await session.run({ phone, phone_lengths, ds, rnd });
  const key = Object.keys(outputMap)[0];
  const out = outputMap[key] as ort.Tensor;
  return out.data as Float32Array;
}
