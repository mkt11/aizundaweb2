// src/hooks/useOnnxSession.ts
import { useState, useEffect } from 'react';
import { InferenceSession } from 'onnxruntime-web';

export function useOnnxSession(modelUrl: string) {
  const [session, setSession] = useState<InferenceSession | null>(null);

  useEffect(() => {
    InferenceSession.create(modelUrl, { executionProviders: ['wasm'] })
      .then(setSession)
      .catch(console.error);
  }, [modelUrl]);

  return session;
}
