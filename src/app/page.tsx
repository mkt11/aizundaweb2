// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useOnnxSession } from './hooks/useOnnxSession';
import FileUploader from './components/FileUploader';
import ProcessingStatus from './components/ProcessingStatus';
import AudioPlayer from './components/AudioPlayer';
import { runPipeline } from './utils/onnxRuntimeClient';

export default function Home() {
  const session = useOnnxSession('/model/AISO-HOWATTO.onnx');
  const [status, setStatus] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!session) return;
    setStatus('処理中... WASM バックエンドで推論しています');
    try {
      const url = await runPipeline(file, setStatus, 'wasm');
      setOutputUrl(url);
      setStatus(null);
    } catch (e: any) {
      setStatus(`エラーが発生しました: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-6">RVC 音声変換 (WASM)</h1>
        {!session ? (
          <p className="text-center text-gray-500">モデルを読み込み中…</p>
        ) : (
          <>
            <div className="mb-6">
              <FileUploader onFileReady={handleFile} />
            </div>
            {status && (
              <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
                <ProcessingStatus message={status} />
              </div>
            )}
            {outputUrl && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">変換結果プレビュー</h2>
                <AudioPlayer src={outputUrl} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
