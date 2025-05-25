'use client';

import { useState, useEffect } from 'react';
import { useOnnxSession }         from './hooks/useOnnxSession';
import { loadAudio, pcmToWavBlob } from './utils/audio';
import Recorder                   from './components/Recorder';
import FileUploader               from './components/FileUploader';
import AudioPreview               from './components/AudioPreview';
import ProcessingStatus           from './components/ProcessingStatus';
import { runPipeline }            from './utils/onnxRuntimeClient';

type Mode = 'server' | 'client';

export default function Home() {
  const session = useOnnxSession('/model/hubert_base.onnx');
  const [mode, setMode]           = useState<Mode>('server');
  const [rawBlob, setRawBlob]     = useState<Blob | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceURL, setSourceURL] = useState<string | null>(null);
  const [resultURL, setResultURL] = useState<string | null>(null);
  const [status, setStatus]       = useState<string | null>(null);

  // ① MediaRecorder の生出力(rawBlob) → WAV に
  useEffect(() => {
    if (!rawBlob) return;
    (async () => {
      setStatus('🔄 WAV 変換中…');
      // 生 Blob を一旦 File 化（拡張子は適当でOK）
      const rawFile = new File([rawBlob], 'raw.webm');
      // PCM にデコード
      const pcm = await loadAudio(rawFile);
      // PCM → WAV Blob
      const wavBlob = pcmToWavBlob(pcm, 16000);
      // WAV Blob → File
      const wavFile = new File([wavBlob], 'record.wav', { type: 'audio/wav' });
      setSourceFile(wavFile);
      setSourceURL(URL.createObjectURL(wavFile));
      setResultURL(null);
      setStatus(null);
    })();
  }, [rawBlob]);

  // ② 推論ハンドラ
  const handleInfer = async () => {
    if (!sourceFile) return;
    setStatus(mode === 'server' ? '⏳ サーバー推論中…' : '⏳ クライアント推論中…');
    try {
      let url: string;
      if (mode === 'server') {
        const form = new FormData();
        form.append('file', sourceFile);
        const res = await fetch('/api/infer', { method: 'POST', body: form });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
      } else {
        if (!session) return;
        url = await runPipeline(sourceFile, setStatus, 'wasm');
      }
      setResultURL(url);
      setStatus(null);
    } catch (e: any) {
      setStatus(`❌ エラー: ${e.message}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 p-6">
      <h1 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
        AIずんだもん 2
      </h1>

      {/* モード切替 */}
      <div className="flex justify-center space-x-4">
        {(['server','client'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              mode === m
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {m === 'server' ? 'Server 推論' : 'Client 推論'}
          </button>
        ))}
      </div>

      {/* 入力コントロール */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 録音 */}
        <Recorder onRecorded={(b) => setRawBlob(b)} />
        {/* ファイル選択 */}
        <FileUploader onFileReady={(f) => {
          setRawBlob(null);
          setSourceFile(f);
          setSourceURL(URL.createObjectURL(f));
          setResultURL(null);
        }} />
      </div>

      {/* Before プレビュー */}
      {sourceURL && <AudioPreview label="Before" src={sourceURL} />}

      {/* 推論ボタン */}
      {sourceFile && (
        <div className="text-center">
          <button
            onClick={handleInfer}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition"
          >
            推論を{mode === 'server' ? 'サーバーで' : 'クライアントで'}実行
          </button>
        </div>
      )}

      {/* ステータス＆プログレス */}
      {status && <ProcessingStatus message={status} />}

      {/* After プレビュー */}
      {resultURL && <AudioPreview label="After" src={resultURL} />}
    </div>
  );
}
