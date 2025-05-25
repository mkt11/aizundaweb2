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
const RVC_ONNX    = path.join(MODEL_DIR, 'zundamon.onnx')

// セッションキャッシュ
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
// half precision buffer → Float32Array 変換
// ────────────────
function halfToFloat32(half: Uint16Array): Float32Array {
  const out = new Float32Array(half.length)
  for (let i = 0; i < half.length; i++) {
    const h = half[i]
    const s = (h & 0x8000) >> 15
    const e = (h & 0x7C00) >> 10
    const m = h & 0x03FF
    if (e === 0) {
      // subnormal
      out[i] = (s ? -1 : 1) * Math.pow(2, -14) * (m / 1024)
    } else if (e === 0x1F) {
      // inf or NaN
      out[i] = m ? NaN : ((s ? -1 : 1) * Infinity)
    } else {
      // normalized
      out[i] = (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + m / 1024)
    }
  }
  return out
}

/**
 * メインパイプライン：WAV → HuBERT → 補間 → RVC → 解凍 → WAV
 */
export async function inferRvc(wavBytes: Uint8Array): Promise<Uint8Array> {
  // 1) decode
  const { pcm: raw, sampleRate } = await decodeWav(wavBytes)

  // 2) 16kHz に揃える
  const pcm16k = (sampleRate === 16000)
    ? raw
    : resampleLinear(raw, sampleRate, 16000)

  // 3) HuBERT
  const hubert        = await getHubertSession()
  const { data: f0, dims: d0 } = await extractFeatures(pcm16k, hubert)

  // 4) 2 倍補間
  const { data: fi, dims: di } = interpolateFeats(f0, d0)

  // 5) RVC 推論
  const rvc    = await getRvcSession()
  const rawOut = await runRvc(fi, di, rvc)

  // 6) rawOut が Uint16Array (float16) なら解凍、それ以外はそのまま
  const pcmOut = rawOut instanceof Uint16Array
    ? halfToFloat32(rawOut)
    : rawOut

  // 7) 40kHz でエンコード
  return encodeWav(pcmOut, 40000)
}

// ────────────────
// 以下、クライアントと同一の補助関数群
// ────────────────

async function extractFeatures(
  pcm: Float32Array,
  session: ort.InferenceSession
): Promise<{ data: Float32Array; dims: [number, number, number] }> {
  const N    = pcm.length
  const src  = new ort.Tensor('float32', pcm, [1, N])
  const mask = new ort.Tensor('bool',    new Uint8Array(N), [1, N])
  const out  = await session.run({ source: src, padding_mask: mask })
  const t    = out[session.outputNames[0]] as ort.Tensor
  return { data: t.data as Float32Array, dims: t.dims as [number, number, number] }
}

function interpolateFeats(
  feats: Float32Array,
  dims:  [number, number, number]
): { data: Float32Array; dims: [number, number, number] } {
  const [B, T, C] = dims
  const newT      = T * 2
  const out       = new Float32Array(B * newT * C)
  for (let b = 0; b < B; b++) {
    for (let t = 0; t < T; t++) {
      for (let c = 0; c < C; c++) {
        const v    = feats[b * T * C + t * C + c]
        const idx  = b * newT * C + (2 * t) * C + c
        out[idx]     = v
        out[idx + C] = v
      }
    }
  }
  return { data: out, dims: [B, newT, C] }
}

async function runRvc(
  feats: Float32Array,
  dims:  [number, number, number],
  session: ort.InferenceSession
): Promise<Float32Array | Uint16Array> {
  const [B, T, C] = dims

  // half 精度エンコード
  const feats16 = (() => {
    const dst = new Uint16Array(feats.length)
    for (let i = 0; i < feats.length; i++) {
      const x    = Math.fround(feats[i])
      const sbit = (x < 0 ? 1 : 0) << 15
      const a    = Math.abs(x)
      if (isNaN(a))            dst[i] = sbit | 0x7e00
      else if (a === Infinity) dst[i] = sbit | 0x7c00
      else if (a === 0)        dst[i] = sbit
      else {
        const e    = Math.floor(Math.log2(a))
        let   m    = a / 2**e - 1
        const e16  = e + 15
        if (e16 >= 31)          dst[i] = sbit | 0x7c00
        else if (e16 <= 0)      dst[i] = sbit
        else {
          m = Math.round(m * 1024)
          dst[i] = sbit | (e16 << 10) | m
        }
      }
    }
    return dst
  })()

  const phone   = new ort.Tensor('float16', feats16, [B, T, C])
  const plen    = new ort.Tensor('int64',   BigInt64Array.from([BigInt(T)]), [1])
  const ds      = new ort.Tensor('int64',   BigInt64Array.from([0n]),       [1])
  const rndArr  = Float32Array.from({ length: B * 192 * T },
                    () => (Math.random() * 2 - 1) * 0.66666)
  const rnd     = new ort.Tensor('float32', rndArr, [B, 192, T])

  const feeds: Record<string, ort.Tensor> = {}
  for (const name of session.inputNames) {
    if (name === 'phone'    || name === 'feats')      feeds[name] = phone
    else if (name === 'phone_lengths' || name === 'p_len') feeds[name] = plen
    else if (name === 'ds'      || name === 'sid')    feeds[name] = ds
    else if (name === 'rnd')                         feeds[name] = rnd
    else throw new Error(`Unexpected input name: ${name}`)
  }

  console.log('▶ RVC feeds:', session.inputNames.map(n => `${n}=${feeds[n].dims}@${feeds[n].type}`))
  const outMap = await session.run(feeds)
  const t      = outMap[session.outputNames[0]] as ort.Tensor

  // 出力データの型で判定
  if (t.data instanceof Uint16Array) {
    console.log('◀ RVC output is Uint16Array (float16 buffer)')
    return t.data as Uint16Array
  } else {
    console.log('◀ RVC output is Float32Array')
    return t.data as Float32Array
  }
}
