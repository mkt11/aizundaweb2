/// <reference types="node" />

declare module 'wav-decoder' {
    export interface DecodeResult {
      sampleRate: number;
      channelData: Float32Array[];
    }
    /**
     * ArrayBuffer や DataView を渡すと WAV を解析して返す
     */
    export function decode(
      buffer: ArrayBuffer | DataView
    ): Promise<DecodeResult>;
  
    // デフォルトでも呼び出せるように
    const _default: { decode: typeof decode };
    export default _default;
  }
  
  declare module 'wav-encoder' {
    export interface WavEncodeOptions {
      sampleRate: number;
      channelData: Float32Array[];
    }
    /**
     * PCM データを ArrayBuffer にエンコードして返す
     */
    export function encode(options: WavEncodeOptions): Promise<ArrayBuffer>;
  
    // デフォルトインポートに対応
    const _default: { encode: typeof encode };
    export default _default;
  }
  