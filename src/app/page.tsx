// src/app/page.tsx
'use client';

import { useState } from 'react';
import FileUploader from './components/FileUploader';
import ProcessingStatus from './components/ProcessingStatus';
import AudioPlayer from './components/AudioPlayer';
import { runPipeline } from './utils/onnxRuntimeClient';

export default function Home() {
  const [status, setStatus] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [useGPU, setUseGPU] = useState<boolean>(false);

  const handleFile = async (file: File) => {
    setStatus('読み込み中...');
    const provider = useGPU ? 'webgl' : 'wasm';
    const url = await runPipeline(file, setStatus, provider);
    setOutputUrl(url);
    setStatus(null);
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">RVC 音声変換 Webアプリ</h1>
      <div className="mb-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={useGPU}
            onChange={e => setUseGPU(e.target.checked)}
          />
          <span className="ml-2">GPU（WebGL）を使う</span>
        </label>
      </div>
      <FileUploader onFileReady={handleFile} />
      {status && <ProcessingStatus message={status} />}
      {outputUrl && <AudioPlayer src={outputUrl} />}
    </>
  );
}
