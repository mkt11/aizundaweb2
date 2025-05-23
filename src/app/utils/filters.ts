// src/utils/filters.ts
// OfflineAudioContext を用いた Butterworth 高域フィルタ相当
export async function highpassFilter(
    audio: Float32Array,
    sampleRate: number = 16000
  ): Promise<Float32Array> {
    const length = audio.length;
    const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
    const buffer = offlineCtx.createBuffer(1, length, sampleRate);
    buffer.copyToChannel(audio, 0);
  
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
  
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 48;
    filter.Q.value = Math.SQRT1_2; // Q = 1/√2 (Butterworth)
  
    source.connect(filter).connect(offlineCtx.destination);
    source.start();
  
    const rendered = await offlineCtx.startRendering();
    return rendered.getChannelData(0);
  }
  