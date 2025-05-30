// src/utils/onnxRuntimeClient.ts

import * as ort from 'onnxruntime-web'
import { loadAudio, pcmToWavBlob } from './audio'
import { highpassFilter }          from './filters'

export type Provider = 'wasm' | 'webgl'

const HUBERT_MODEL_URL = '/model/hubert_base.onnx'
const RVC_MODEL_URL   = '/model/tsukuyomi-chan.onnx'
const MIN_AUDIO_LEN   = 160       // HuBERT の Conv が動く最小サンプル数
const SAMPLE_RATE     = 16000     // クライアント側では常に 16kHz と仮定
const MIN_F0          = 50        // F0 の最小値(Hz)
const MAX_F0          = 500       // F0 の最大値(Hz)

/**
 * Float32Array → Uint16Array (IEEE754 half) 変換
 */
function float32ToHalfBuffer(src: Float32Array): Uint16Array {
  const dst = new Uint16Array(src.length)
  for (let i = 0; i < src.length; ++i) {
    const x = src[i]
    const s = (x < 0 ? 1 : 0) << 15
    const absx = Math.abs(x)
    if (isNaN(absx)) {
      dst[i] = s | 0x7e00
    } else if (absx === Infinity) {
      dst[i] = s | 0x7c00
    } else if (absx === 0) {
      dst[i] = s
    } else {
      const exp = Math.floor(Math.log2(absx))
      const mantissa = absx / 2**exp - 1
      const e16 = exp + 15
      if (e16 >= 31) {
        dst[i] = s | 0x7c00
      } else if (e16 <= 0) {
        dst[i] = s
      } else {
        const m = Math.round(mantissa * 1024)
        dst[i] = s | (e16 << 10) | m
      }
    }
  }
  return dst
}

/**
 * PM アルゴリズムでピッチ (F0) を推定
 */
function extractPitchPm(pcm: Float32Array, sr: number): Float32Array {
  const hop = Math.floor(sr * 0.010)  // 10ms ごとに評価
  const frames = Math.floor(pcm.length / hop)
  const f0 = new Float32Array(frames)
  for (let i = 0; i < frames; i++) {
    const center = i * hop + Math.floor(hop / 2)
    const start  = Math.max(0, center - 512)
    const end    = Math.min(pcm.length, center + 512)
    f0[i]        = estimatePitchPmSegment(pcm.subarray(start, end), sr, MIN_F0, MAX_F0)
  }
  return f0
}

function estimatePitchPmSegment(
  seg: Float32Array,
  sr: number,
  minF: number,
  maxF: number
): number {
  const minLag = Math.floor(sr / maxF)
  const maxLag = Math.floor(sr / minF)
  let bestLag = minLag, bestR = -Infinity
  for (let lag = minLag; lag <= maxLag; lag++) {
    let r = 0
    for (let j = 0; j + lag < seg.length; j++) {
      r += seg[j] * seg[j + lag]
    }
    if (r > bestR) {
      bestR = r
      bestLag = lag
    }
  }
  const r0 = autocorr(seg, bestLag - 1)
  const r2 = autocorr(seg, bestLag + 1)
  const denom = 2 * (r0 - 2 * bestR + r2)
  const delta = denom === 0 ? 0 : (r0 - r2) / denom
  return sr / (bestLag + delta)
}

function autocorr(seg: Float32Array, lag: number): number {
  let r = 0
  for (let i = 0; i + lag < seg.length; i++) {
    r += seg[i] * seg[i + lag]
  }
  return r
}

/**
 * メインパイプライン
 */
export async function runPipeline(
  file: File,
  setStatus: (msg: string) => void,
  provider: Provider = 'wasm',
  semitone: number = 0
): Promise<string> {
  try {
    // 1) WAV → PCM
    setStatus('🔄 音声読み込み中…')
    const pcm = await loadAudio(file)
    if (pcm.length === 0) throw new Error('録音された音声が空です')

    // 2) ポップノイズ除去
    setStatus('🔄 ポップノイズ除去中…')
    let filtered = await highpassFilter(pcm, SAMPLE_RATE)
    if (!(filtered instanceof Float32Array)) {
      filtered = Float32Array.from(filtered as Iterable<number>)
    }

    // 3) 最低長パディング
    if (filtered.length < MIN_AUDIO_LEN) {
      const tmp = new Float32Array(MIN_AUDIO_LEN)
      tmp.set(filtered, 0)
      filtered = tmp
    }

    // 4) HuBERT 特徴抽出
    setStatus('🔄 HuBERT 特徴抽出中…')
    const hubert = await createSession(HUBERT_MODEL_URL, provider)
    const { data: featData, dims: featDims } = await extractFeatures(filtered, hubert)

    // 5) 特徴補間
    setStatus('🔄 特徴補間中…')
    const interp = interpolateFeats(featData, featDims)

    // 6) F0 抽出・量子化（semitone シフト対応）
    setStatus('🔄 F0 抽出中…')
    let f0Arr = extractPitchPm(filtered, SAMPLE_RATE)
    if (semitone !== 0) {
      const factor = 2 ** (semitone / 12)
      f0Arr = f0Arr.map(v => v * factor)
    }
    const coarseArr = new BigInt64Array(f0Arr.length)
    for (let i = 0; i < f0Arr.length; i++) {
      const c = Math.max(MIN_F0, Math.min(MAX_F0, f0Arr[i]))
      const n = (Math.log2(c) - Math.log2(MIN_F0)) /
                (Math.log2(MAX_F0) - Math.log2(MIN_F0))
      coarseArr[i] = BigInt(Math.round(n * 254) + 1)
    }

    // 7) RVC 推論
    setStatus('🔄 RVC 推論中…')
    const rvc = await createSession(RVC_MODEL_URL, provider)
    const pcmOut = await runRVC(interp, featDims, f0Arr, coarseArr, rvc)

    // 8) WAV 化して URL を返す
    setStatus('🔄 WAV 生成中…')
    const blob = pcmToWavBlob(pcmOut, 40000)
    return URL.createObjectURL(blob)
  } catch (e) {
    setStatus('推論エラー');
    throw e;
  }
}

/**
 * ONNX セッション作成
 */
async function createSession(
  modelUrl: string,
  provider: Provider
): Promise<ort.InferenceSession> {
  let session: ort.InferenceSession
  if (provider === 'webgl') {
    try {
      session = await ort.InferenceSession.create(modelUrl, { executionProviders: ['webgl'] })
    } catch {
      session = await ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] })
    }
  } else {
    session = await ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] })
  }
  console.log(`👀 モデル: ${modelUrl}`, 'inputs:', session.inputNames, 'outputs:', session.outputNames)
  return session
}

/**
 * HuBERT 特徴抽出
 */
async function extractFeatures(
  audio: Float32Array,
  session: ort.InferenceSession
): Promise<{ data: Float32Array; dims: number[] }> {
  const len = audio.length
  const src  = new ort.Tensor('float32', audio, [1, len])
  const mask = new ort.Tensor('bool',    new Uint8Array(len), [1, len])
  const out  = await session.run({ source: src, padding_mask: mask })
  const key  = Object.keys(out)[0]
  const t    = out[key] as ort.Tensor
  return { data: t.data as Float32Array, dims: t.dims.slice() }
}

/**
 * 特徴を2倍補間
 */
function interpolateFeats(data: Float32Array, dims: number[]): Float32Array {
  const [B, T, C] = dims
  const dst = new Float32Array(B * T * 2 * C)
  for (let b = 0; b < B; b++) {
    for (let t = 0; t < T; t++) {
      for (let c = 0; c < C; c++) {
        const v   = data[b * T * C + t * C + c]
        const idx = b * (T * 2) * C + (t * 2) * C + c
        dst[idx]     = v
        dst[idx + C] = v
      }
    }
  }
  return dst
}

/**
 * RVC 実行 (pitch, pitchf を含む)
 */
async function runRVC(
  feats: Float32Array,
  dims: number[],
  f0Arr: Float32Array,
  coarseArr: BigInt64Array,
  session: ort.InferenceSession
): Promise<Float32Array> {
  const [B, T, C] = dims
  const feats16 = float32ToHalfBuffer(feats)
  const T2 = feats.length / C

  const pad = <T>(arr: T[], len: number, fill: T): T[] =>
    arr.length > len ? arr.slice(0, len) : [...arr, ...Array(len - arr.length).fill(fill)]

  const f0Adj     = pad(Array.from(f0Arr),     T2, f0Arr[f0Arr.length - 1])
  const coarseAdj = pad(Array.from(coarseArr), T2, coarseArr[coarseArr.length - 1])

  const feeds: Record<string, ort.Tensor> = {
    feats:  new ort.Tensor('float16', feats16,        [B, T2, C]),
    p_len:  new ort.Tensor('int64',   BigInt64Array.from([BigInt(T2)]), [1]),
    sid:    new ort.Tensor('int64',   BigInt64Array.from([0n]),          [1]),
    pitch:  new ort.Tensor('int64',   BigInt64Array.from(coarseAdj),    [B, T2]),
    pitchf: new ort.Tensor('float32', Float32Array.from(f0Adj),         [B, T2]),
  }

  console.log('▶ runRVC feeds:', Object.entries(feeds).map(([k, t]) => `${k}:${t.dims}@${t.type}`))
  const outMap = await session.run(feeds)
  const key    = Object.keys(outMap)[0]
  const t      = outMap[key] as ort.Tensor
  console.log(`◀ runRVC output ${key}: dims=${t.dims}, type=${t.type}`)
  return t.data as Float32Array
}
