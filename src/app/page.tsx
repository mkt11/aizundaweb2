'use client';

import { useState, useEffect } from 'react';
import CyberBackground from './components/CyberBackground';
import Character from './components/Character';
import Recorder from './components/Recorder';
import AudioPreview from './components/AudioPreview';
import ProcessingStatus from './components/ProcessingStatus';
import Intro from './components/Intoro';
import { useOnnxSession } from './hooks/useOnnxSession';
import { runPipeline } from './utils/onnxRuntimeClient';
import { loadAudio, pcmToWavBlob } from './utils/audio';
import { motion } from "framer-motion";

type Mode = 'server' | 'client';
type Stage = 'idle' | 'recording' | 'inference';

export default function Home() {
  const session = useOnnxSession('/model/hubert_base.onnx');
  const [mode, setMode] = useState<Mode>('server');
  const [rawBlob, setRawBlob] = useState<Blob|null>(null);
  const [sourceFile, setSourceFile] = useState<File|null>(null);
  const [sourceURL, setSourceURL] = useState<string|null>(null);
  const [resultURL, setResultURL] = useState<string|null>(null);
  const [status, setStatus] = useState<string|null>(null);

  // バグ修正: stage の判定ロジックを強化
  // 完了またはエラーのステータスを優先的にチェックし、'idle' にする
  const stage: Stage =
    status && (status.includes('完了!') || status.includes('エラー:')) ? 'idle' :
    status?.includes('録音中') ? 'recording' : // '録音中…'などを含む場合
    status?.includes('推論中…') || status?.includes('WAV化中…') ? 'inference' :
                                      'idle'; // デフォルトまたは上記以外

  useEffect(() => {
    if (!rawBlob) return;
    (async () => {
      setStatus('🔄 WAV化中…');
      const file = new File([rawBlob], 'record.webm');
      const pcm = await loadAudio(file);
      const wavBlob = pcmToWavBlob(pcm, 16000);
      const wavFile = new File([wavBlob], 'record.wav', { type:'audio/wav' });
      setSourceFile(wavFile);
      setSourceURL(URL.createObjectURL(wavFile));
      setResultURL(null);
      setStatus(null);
    })();
  }, [rawBlob]);

  const handleInfer = async () => {
    if (!sourceFile) return;
    setStatus(mode === 'server' ? '⏳ サーバー推論中…' : '⏳ クライアント推論中…');
    try {
      let url: string;
      if (mode === 'server') {
        const form = new FormData();
        form.append('file', sourceFile);
        const res = await fetch('/api/infer',{ method:'POST', body:form });
        if (!res.ok) throw new Error(await res.text());
        url = URL.createObjectURL(await res.blob());
      } else {
        if (!session) {
          throw new Error('クライアントモデルのセッションがロードされていません。');
        }
        // runPipeline が内部で setStatus を呼ぶ可能性を考慮
        url = await runPipeline(sourceFile, setStatus, 'wasm');
      }
      setResultURL(url);
      // 推論が完了したとき
      setStatus("完了");
    } catch (e: any) {
      // このエラーメッセージも stage 判定で 'idle' にするトリガーとなる
      setStatus(`❌ エラー: ${e.message}`);
    }
  };

  const handleReset = () => {
    setRawBlob(null);
    setSourceFile(null);
    setSourceURL(null);
    setResultURL(null);
    setStatus(null);
  };

    // Intro表示フラグ
    const [introVisible, setIntroVisible] = useState(true);

    useEffect(() => {
      if (!introVisible) return;
      // 「2」が出てから約1秒後にフェードアウト（合計2.8秒後でOK）
      const timer = setTimeout(() => setIntroVisible(false), 2800);
      return () => clearTimeout(timer);
    }, [introVisible]);

  return (
    <div className="min-h-screen bg-gradient-to-br">

      <Intro visible={introVisible} />

      <CyberBackground
        particleCount={20}
        noiseIntensity={0.0025}
        particleSize={{min: 0.3, max: 1.2}}
      />
      
      {/* 画面全体をFlexコンテナとして、内部の単一の大きな枠を中央に配置 */}
      <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: ["0%", "0%", "0%"] 
      }} 
      transition={{
        duration: 1.5,
        delay: 3
      }}
    >
      <main className="relative z-10 min-h-screen flex items-center justify-center px-2 sm:px-4 py-8">
        {/* Combined Container (操作UIとキャラクターを内包する大きな枠) */}
        <div className="w-full max-w-xs sm:max-w-md md:max-w-3xl lg:max-w-4xl bg-black/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-green-500/60 shadow-2xl shadow-green-500/50 flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 items-stretch">
          
          {/* Left Side: Controls (操作ボタン類) - モバイルでは上(order-2で表示は下) */}
          <div className="md:w-[280px] lg:w-[320px] xl:w-[350px] flex-shrink-0 space-y-3 sm:space-y-4 md:space-y-6 order-2 md:order-1 flex flex-col">
            {/* モード切り替え */}
            <div className="flex justify-center">
              <div className="flex gap-1 sm:gap-2 bg-black/40 backdrop-blur-xl rounded-full p-1.5 sm:p-2 border border-green-500/30">
                {(['server','client'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => {
                        setMode(m);
                    }}
                    className={`px-3 py-1.5 text-[11px] sm:px-4 sm:py-2 sm:text-xs font-bold rounded-full transition-all duration-300 ${
                      mode === m
                        ? 'bg-gradient-to-r from-green-400 to-green-500 text-black shadow-md shadow-green-500/50'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {m === 'server' ? 'Server' : 'Client'}
                  </button>
                ))}
              </div>
            </div>

            {/* レコーダー */}
            <div className="w-full">
              <Recorder onRecorded={b => setRawBlob(b)} />
            </div>

            {/* 変換前オーディオ、推論ボタン、ステータス、変換後オーディオ */}
            {sourceURL && (
              <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-green-500/30 mt-3 sm:mt-4">
                <AudioPreview label="変換前" src={sourceURL} />

                {sourceFile && (!status || !status.includes('中…')  &&  !status.includes('完了')) && (
                  <div className="flex justify-center pt-1 sm:pt-2">
                    <button
                      onClick={handleInfer}
                      disabled={status?.includes('中…')}
                      className="px-6 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base bg-gradient-to-r from-green-400 to-green-500 rounded-full text-black font-bold hover:from-green-500 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      推論を実行
                    </button>
                  </div>
                )}
                
                {status && !status.includes('完了') && (
                  <div className="w-full pt-1 sm:pt-2">
                    <ProcessingStatus message={status} />
                  </div>
                )}

                {resultURL && (
                  <div className="w-full pt-1 sm:pt-2">
                    <AudioPreview label="変換後" src={resultURL} />
                    <div className="flex justify-center pt-2 sm:pt-3">
                      <button
                        onClick={handleReset}
                        className="px-4 py-1.5 text-[11px] sm:px-6 sm:py-2 sm:text-xs font-medium text-green-300 border border-green-400/60 rounded-full hover:bg-green-400/10 hover:text-green-200 transition-all duration-300"
                      >
                        最初からやり直す
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right Side: Character (キャラクター) - モバイルでは下(order-1で表示は上) */}
          <div className="flex-1 flex items-center justify-center order-1 md:order-2 min-h-[200px] sm:min-h-[250px] md:min-h-[300px] bg-black/20 rounded-lg p-2 md:p-0">
            {/* キャラクター表示エリアに背景色とパディングを少し追加（任意） */}
            <Character stage={stage} />
          </div>

        </div>
      </main>
      </motion.div>
    </div>
  );
}