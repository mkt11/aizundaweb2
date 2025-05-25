/// <reference types="node" />

declare module 'wav-decoder' {
    export function decode(buffer: ArrayBuffer): Promise<{
      sampleRate: number;
      channelData: Float32Array[];
    }>;
    export namespace decode {
      function await(arg: DataView): Promise<{
        sampleRate: number;
        channelData: Float32Array[];
      }>;
    }
  }
  
  declare module 'wav-encoder' {
    export interface WavEncodeOptions {
      sampleRate: number;
      channelData: Float32Array[];
    }
    export function encode(options: WavEncodeOptions): Promise<ArrayBuffer>;
  }
  