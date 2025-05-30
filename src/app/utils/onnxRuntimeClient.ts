// src/utils/onnxRuntimeClient.ts

import * as ort from 'onnxruntime-web'
import { loadAudio, pcmToWavBlob } from './audio'
import { highpassFilter }          from './filters'

export type Provider = 'wasm' | 'webgl'

const HUBERT_MODEL_URL = '/model/hubert_base.onnx'
const RVC_MODEL_URL   = '/model/tsukuyomi-chan.onnx'
const MIN_AUDIO_LEN   = 160  // HuBERT の Conv が動く最小サンプル数

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
 * メインパイプライン
 */
export async function runPipeline(
  file: File,
  setStatus: (msg: string) => void,
  provider: Provider = 'wasm'
): Promise<string> {
  try {
    // 1) WAV → PCM
    setStatus('🔄 音声読み込み中…')
    const pcm = await loadAudio(file)
    if (pcm.length === 0) throw new Error('録音された音声が空です')

    // 2) ノイズ除去
    setStatus('🔄 ポップノイズ除去中…')
    let filtered = await highpassFilter(pcm, 16000)
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

    // 6) RVC 推論
    setStatus('🔄 RVC 推論中…')
    const rvc = await createSession(RVC_MODEL_URL, provider)
    const pcmOut = await runRVC(interp, featDims[2], rvc)

    // 7) WAV 化して URL を返す
    setStatus('🔄 WAV 生成中…')
    const blob = pcmToWavBlob(pcmOut, 40000)
    return URL.createObjectURL(blob)

  } catch (err: any) {
    console.error('🚨 runPipeline error:', err)
    setStatus(`❌ エラー: ${err.message || err}`)
    throw err
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
        const v = data[b * T * C + t * C + c]
        const idx = b * (T * 2) * C + (t * 2) * C + c
        dst[idx]     = v
        dst[idx + C] = v
      }
    }
  }
  return dst
}

async function runRVC(
  feats: Float32Array,
  C: number,
  session: ort.InferenceSession
): Promise<Float32Array> {
  const T2 = feats.length / C
  // half 精度にエンコード
  const feats16 = float32ToHalfBuffer(feats)

  const feeds: Record<string, ort.Tensor> = {
    feats: new ort.Tensor('float16', feats16, [1, T2, C]),
    p_len: new ort.Tensor('int64',  BigInt64Array.from([BigInt(T2)]), [1]),
    sid:   new ort.Tensor('int64',  BigInt64Array.from([0n]), [1]),
  }

  console.log('▶ runRVC feeds:', Object.entries(feeds).map(([k,t])=>`${k}:${t.dims}@${t.type}`))

  const outMap = await session.run(feeds)
  const key    = Object.keys(outMap)[0]
  const t      = outMap[key] as ort.Tensor

  console.log(`◀ runRVC output ${key}: dims=${t.dims}, type=${t.type}`)
  return t.data as Float32Array
}
