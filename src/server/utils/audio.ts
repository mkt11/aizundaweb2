import { decode as wavDecode } from 'wav-decoder'

/**
 * WAVバイト列 → { pcm: Float32Array; sampleRate: number }
 */
export async function decodeWav(
  bytes: Uint8Array
): Promise<{ pcm: Float32Array; sampleRate: number }> {
  // Uint8Array をコピーして純粋な ArrayBuffer を渡す
  const copy        = new Uint8Array(bytes)
  const arrayBuffer = copy.buffer

  const decoded = await wavDecode(arrayBuffer)
  if (!decoded.channelData || decoded.channelData.length === 0) {
    throw new Error('Invalid AudioData')
  }
  return {
    pcm:         decoded.channelData[0],    // モノラル1ch
    sampleRate:  decoded.sampleRate
  }
}

/**
 * Float32Array → WAV Uint8Array (16bit PCM, little-endian RIFF)
 * クライアントの pcmToWavBlob と完全同一ロジック
 */
export function encodeWav(pcm: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2
  const blockAlign     = bytesPerSample * 1
  const byteRate       = sampleRate * blockAlign
  const dataSize       = pcm.length * bytesPerSample
  const buffer         = new ArrayBuffer(44 + dataSize)
  const dv             = new DataView(buffer)

  // RIFFヘッダ
  writeString(dv, 0,  'RIFF')
  dv.setUint32(4, 36 + dataSize, true)
  writeString(dv, 8,  'WAVE')
  writeString(dv, 12, 'fmt ')
  dv.setUint32(16, 16, true)         // Subchunk1Size
  dv.setUint16(20, 1,  true)         // AudioFormat = PCM
  dv.setUint16(22, 1,  true)         // NumChannels = 1
  dv.setUint32(24, sampleRate, true) // SampleRate
  dv.setUint32(28, byteRate,   true) // ByteRate
  dv.setUint16(32, blockAlign,true)  // BlockAlign
  dv.setUint16(34, 16,         true) // BitsPerSample
  writeString(dv, 36, 'data')
  dv.setUint32(40, dataSize,   true) // Subchunk2Size

  // PCMデータ
  let offset = 44
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]))
    dv.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    offset += 2
  }

  return new Uint8Array(buffer)
}

function writeString(dv: DataView, offset: number, s: string) {
  for (let i = 0; i < s.length; i++) {
    dv.setUint8(offset + i, s.charCodeAt(i))
  }
}
