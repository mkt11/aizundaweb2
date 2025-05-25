import * as ort from 'onnxruntime-node';
import { decodeWav, encodeWav } from './audio'; 

const HUBERT_MODEL = process.cwd() + '/server_model/hubert_base.onnx';
const RVC_MODEL   = process.cwd() + '/server_model/AISO-HOWATTO.onnx';

let hubertSession: ort.InferenceSession | null = null;
let rvcSession: ort.InferenceSession | null    = null;

async function getHubertSession() {
  if (!hubertSession) {
    hubertSession = await ort.InferenceSession.create(HUBERT_MODEL, { executionProviders: ['cpu'] });
  }
  return hubertSession;
}

async function getRvcSession() {
  if (!rvcSession) {
    rvcSession = await ort.InferenceSession.create(RVC_MODEL, { executionProviders: ['cpu'] });
  }
  return rvcSession;
}

/**
 * RVC 推論の API 層。入力 WAV バイト列 → 出力 WAV バイト列
 */
export async function inferRvc(wavBytes: Uint8Array): Promise<Uint8Array> {
  // 1. WAV → Float32Array
  const pcm = await decodeWav(wavBytes);        // [Float32Array], sr=16000

  // 2. HuBERT 特徴抽出
  const hubertSess = await getHubertSession();
  const feats = await extractFeatures(pcm, hubertSess);

  // 3. 特徴補間
  const interp = interpolateFeats(feats);

  // 4. RVC 推論
  const rvcSess = await getRvcSession();
  const outPcm = await runRvc(interp, rvcSess);

  // 5. Float32Array → WAV
  return await encodeWav(outPcm, 40000);
}

/** 以下は client と同様の処理を Node 上で行うユーティリティ関数 **/
import { Tensor } from 'onnxruntime-node';

async function extractFeatures(audio: Float32Array, session: ort.InferenceSession) {
  const len = audio.length;
  const src  = new Tensor('float32', audio, [1, len]);
  const mask = new Tensor('bool', new Uint8Array(len), [1, len]);
  const output = await session.run({ source: src, padding_mask: mask });
  const key = Object.keys(output)[0];
  return (output[key] as Tensor).data as Float32Array; // [1,T,256] → flatten
}

function interpolateFeats(feats: Float32Array) {
  const C = 256;
  const T = feats.length / C;
  const out = new Float32Array(T * 2 * C);
  for (let t = 0; t < T; t++) {
    for (let c = 0; c < C; c++) {
      const v = feats[t * C + c];
      out[2 * t * C + c]     = v;
      out[(2 * t + 1) * C + c] = v;
    }
  }
  return out;
}

async function runRvc(feats: Float32Array, session: ort.InferenceSession) {
  const C = 256;
  const T2 = feats.length / C;
  const phone = new Tensor('float32', feats, [1, T2, C]);
  const phone_lengths = new Tensor('int64', BigInt64Array.from([BigInt(T2)]), [1]);
  const ds = new Tensor('int64', BigInt64Array.from([0n]), [1]);
  const rnd = new Tensor(
    'float32',
    Float32Array.from({ length: 1 * 192 * T2 }, () => (Math.random() * 2 - 1) * 0.66666),
    [1, 192, T2]
  );
  const output = await session.run({ phone, phone_lengths, ds, rnd });
  const key = Object.keys(output)[0];
  return (output[key] as Tensor).data as Float32Array;
}
