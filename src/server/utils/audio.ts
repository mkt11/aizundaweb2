// src/server/utils/audio.ts

import * as wav from 'wav-decoder';
import encoder from 'wav-encoder';

/** WAV バイト列 → Float32Array */
export async function decodeWav(bytes: Uint8Array): Promise<Float32Array> {
  // bytes.buffer は実体が ArrayBuffer なので、as ArrayBuffer でキャスト
  const arrayBuffer = bytes.buffer as ArrayBuffer;
  // ここで純粋な ArrayBuffer を渡す
  const decoded = await wav.decode(arrayBuffer);
  return decoded.channelData[0];
}

export async function encodeWav(
  pcm: Float32Array,
  sampleRate: number
): Promise<Uint8Array> {
  const wavBuffer = await encoder.encode({
    sampleRate,
    channelData: [pcm],
  });
  return new Uint8Array(wavBuffer);
}
