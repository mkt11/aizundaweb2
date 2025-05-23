// src/utils/audio.ts
// Web Audio API を用いたデコード・リサンプリングと WAV 生成
export async function loadAudio(file: File): Promise<Float32Array> {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    return decoded.getChannelData(0);
  }
  
  export function pcmToWavBlob(pcm: Float32Array, sampleRate: number): Blob {
    const bytesPerSample = 2;
    const blockAlign = bytesPerSample * 1;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcm.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const dv = new DataView(buffer);
  
    /* RIFF チャンク */
    writeString(dv, 0, 'RIFF');
    dv.setUint32(4, 36 + dataSize, true);
    writeString(dv, 8, 'WAVE');
    /* fmt サブチャンク */
    writeString(dv, 12, 'fmt ');
    dv.setUint32(16, 16, true);           // サブチャンクサイズ
    dv.setUint16(20, 1, true);            // フォーマット (PCM)
    dv.setUint16(22, 1, true);            // チャンネル数
    dv.setUint32(24, sampleRate, true);   // サンプルレート
    dv.setUint32(28, byteRate, true);     // バイトレート
    dv.setUint16(32, blockAlign, true);   // ブロックアライン
    dv.setUint16(34, 16, true);           // ビット深度
    /* data サブチャンク */
    writeString(dv, 36, 'data');
    dv.setUint32(40, dataSize, true);
  
    // PCM データ書き込み
    let offset = 44;
    for (let i = 0; i < pcm.length; i++) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      dv.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  function writeString(dv: DataView, offset: number, s: string) {
    for (let i = 0; i < s.length; i++) dv.setUint8(offset + i, s.charCodeAt(i));
  }
  