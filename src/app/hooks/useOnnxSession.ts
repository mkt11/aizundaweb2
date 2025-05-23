// src/hooks/useOnnxSession.ts
import { useState, useEffect } from 'react';
import { InferenceSession } from 'onnxruntime-web';

/**
 * ONNX モデルを WASM バックエンドで読み込み、セッションを返す Hook
 * @param modelUrl public/ 以下に配置した .onnx ファイルのパス
 */
export function useOnnxSession(modelUrl: string): InferenceSession | null {
  const [session, setSession] = useState<InferenceSession | null>(null);

  useEffect(() => {
    let canceled = false;
    InferenceSession.create(modelUrl, { executionProviders: ['wasm'] })
      .then((s) => {
        if (!canceled) setSession(s);
      })
      .catch((e) => {
        console.error('ONNX Session creation failed:', e);
      });
    return () => {
      canceled = true;
    };
  }, [modelUrl]);

  return session;
}
