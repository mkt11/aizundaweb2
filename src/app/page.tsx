'use client';

import { useState, useEffect } from 'react';
import { useOnnxSession } from './hooks/useOnnxSession';
import Recorder from './components/Recorder';
import FileUploader from './components/FileUploader';
import AudioPreview from './components/AudioPreview';
import ProcessingStatus from './components/ProcessingStatus';
import { runPipeline } from './utils/onnxRuntimeClient';

export default function Home() {
  const session = useOnnxSession('/model/hubert_base.onnx');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceURL, setSourceURL]   = useState<string | null>(null);
  const [resultURL, setResultURL]   = useState<string | null>(null);
  const [status, setStatus]         = useState<string | null>(null);

  // 録音後にプレビュー用URLを生成
  useEffect(() => {
    if (sourceFile) {
      setSourceURL(URL.createObjectURL(sourceFile));
      setResultURL(null);
    }
  }, [sourceFile]);

  const handleInfer = async () => {
    if (!session || !sourceFile) return;
    setStatus('推論中…');
    try {
      const url = await runPipeline(sourceFile, setStatus, 'wasm');
      setResultURL(url);
      setStatus(null);
    } catch (e: any) {
      setStatus(`エラー: ${e.message}`);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-8">
      <h1 className="text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
        AIずんだもん 2
      </h1>

      {!session ? (
        <p className="text-center text-gray-400">モデルを読み込み中…</p>
      ) : (
        <>
          {/* 入力コントロール */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Recorder onRecorded={(blob) => setSourceFile(new File([blob], 'record.wav'))} />
            <FileUploader onFileReady={setSourceFile} />
          </div>

          {/* プレビュー */}
          {sourceURL && (
            <AudioPreview label="Before" src={sourceURL} />
          )}

          {/* 推論開始 */}
          {sourceFile && (
            <div className="text-center">
              <button
                onClick={handleInfer}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full font-semibold text-white hover:from-pink-600 hover:to-purple-600 transition"
              >
                推論を開始する
              </button>
            </div>
          )}

          {/* ステータス */}
          {status && <ProcessingStatus message={status} />}

          {/* 結果プレビュー */}
          {resultURL && (
            <AudioPreview label="After" src={resultURL} />
          )}
        </>
      )}
    </div>
  );
}
