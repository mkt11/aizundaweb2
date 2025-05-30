// app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

import CyberBackground      from './components/CyberBackground';
import Character            from './components/Character';
import CharacterPopover     from './components/CharacterPopover';
import CharacterHintBubble  from './components/CharacterHintBubble';
import Recorder             from './components/Recorder';
import AudioPreview         from './components/AudioPreview';
import Infomation           from './components/Infomation';
import ProcessingStatus     from './components/ProcessingStatus';
import Intro                from './components/Intoro';
import DisclaimerModal      from './components/DisclaimerModal';
import PitchSlider from './components/PitchSlider';

import { useOnnxSession }   from './hooks/useOnnxSession';
import { runPipeline }      from './utils/onnxRuntimeClient';
import { loadAudio, pcmToWavBlob } from './utils/audio';

/* ————— 型定義 ————— */
type Mode  = 'server' | 'client';
type Stage = 'idle'   | 'recording' | 'inference';

/* ————— Character 型を明示 ————— */
const CharacterView = Character as unknown as React.FC<{ stage: Stage }>;

/* ————— 画面コンポーネント ————— */
export default function Home() {
  /*──────── 基本ステート ────────*/
  const session = useOnnxSession('/model/hubert_base.onnx');

  const [mode,       setMode]       = useState<Mode>('server');
  const [stage,      setStage]      = useState<Stage>('idle');

  const [rawBlob,    setRawBlob]    = useState<Blob|null>(null);
  const [sourceFile, setSourceFile] = useState<File|null>(null);
  const [sourceURL,  setSourceURL]  = useState<string|null>(null);
  const [resultURL,  setResultURL]  = useState<string|null>(null);
  const [status,     setStatus]     = useState<string|null>(null);
  const [semitone, setSemitone] = useState<number>(12);

  /*──────── 免責事項 ────────*/
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [disclaimerAck,  setDisclaimerAck]  = useState(false);

  /*──────── キャラクターポップ ────────*/
  const [popOpen,      setPopOpen]      = useState(false);
  const [popHintShown, setPopHintShown] = useState(true);

  /*──────── 録音ハンドラ ────────*/
  const handleRecordStart = useCallback(() => {
    setStage('recording');
    setStatus('🎙️ 録音中');
  }, []);

  const handleRecordStop = useCallback(() => {
    setStage('idle');
    setStatus(null);
  }, []);

  /*──────── Blob→WAV 変換 ────────*/
  useEffect(() => {
    if (!rawBlob) return;

    (async () => {
      setStatus('🔄 WAV 変換中…');
      try {
        const pcm     = await loadAudio(new File([rawBlob], 'rec.webm'));
        const wavBlob = pcmToWavBlob(pcm, 16_000);
        const wavFile = new File([wavBlob], 'record.wav', { type: 'audio/wav' });

        setSourceFile(wavFile);
        setSourceURL(URL.createObjectURL(wavFile));
        setStatus(null);
      } catch (e) {
        setStatus('WAV変換エラー');
      }
    })();
  }, [rawBlob]);

  /*──────── 推論 ────────*/
  const handleInfer = async () => {
    if (!sourceFile) return;

    setStage('inference');
    setStatus(mode === 'server' ? '⏳ サーバー推論中…' : '⏳ クライアント推論中…');

    try {
      let url: string;

      if (mode === 'server') {
        const form = new FormData();
        form.append('file', sourceFile);
        form.append('semitone', semitone.toString());
        const res = await fetch('/api/infer', { method: 'POST', body: form });
        if (!res.ok) throw new Error(await res.text());
        url = URL.createObjectURL(await res.blob());
      } else {
        if (!session) throw new Error('クライアントモデルがロードされていません。');
        url = await runPipeline(sourceFile, setStatus, 'wasm', semitone);
      }

      setResultURL(url);
      setStatus('✅ 完了!');
    } finally {
      setStage('idle');
    }
  };

  /*──────── リセット ────────*/
  const handleReset = () => {
    setRawBlob(null);
    setSourceFile(null);
    setSourceURL(null);
    setResultURL(null);
    setStatus(null);
    setStage('idle');
  };

  /*──────── Intro / 免責事項タイミング ────────*/
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIntroVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDisclaimerOpen(true), 4500);
    return () => clearTimeout(t);
  }, []);

  /*──────── JSX ────────*/
  return (
    <div className="">
      <Intro visible={introVisible} />

      <CyberBackground
        particleCount={0}
        particleSize={{ min: 0.3, max: 5 }}
        sakuraCount={10}
        sakuraSpeed={0.6}
      />

      {/* 免責事項モーダル */}
      <DisclaimerModal
        visible={disclaimerOpen}
        onClose={() => {
          setDisclaimerOpen(false);
          setDisclaimerAck(true);
        }}
      />

      {/* キャラクター詳細 */}
      <CharacterPopover visible={popOpen} onClose={() => setPopOpen(false)} />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 3 }}
      >
        <main className="relative z-10 min-h-screen flex items-center justify-center px-2 sm:px-4 py-8">
          <div className="relative w-full max-w-xs sm:max-w-md md:max-w-3xl lg:max-w-4xl
                          bg-black/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8
                          border border-cyan-400/60 shadow-2xl shadow-cyan-500/50
                          flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 items-stretch">

            {/* ——— 操作パネル ——— */}
            <div className="md:w-[280px] lg:w-[320px] xl:w-[350px] flex-shrink-0
                            space-y-3 sm:space-y-4 md:space-y-6 order-2 md:order-1 flex flex-col">

              {/* アプリ説明 */}
              <div className="text-[11px] sm:text-xs leading-relaxed text-cyan-200
                              bg-black/30 rounded-lg p-3 border border-cyan-400/20">
                録音した<span className="font-semibold text-white">あなたの声</span>を
                <span className="font-semibold text-white">HuBERT × RVC</span> で
                「つくよみちゃん」の声に変換するWebアプリです。<span className="font-semibold text-white">男性はピッチを +12 、女性は ±0 程度に</span>に設定することをお勧めします。<span className="font-semibold text-white">歌なども変換可能です。</span>
              </div>

              {/* モード切替 */}
              <div className="flex justify-center">
                <div className="flex gap-1 sm:gap-2 bg-black/40 backdrop-blur-xl
                                rounded-full p-1.5 sm:p-2 border border-cyan-400/30">
                  {(['server', 'client'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-3 py-1.5 text-[11px] sm:px-4 sm:py-2 sm:text-xs font-bold rounded-full
                        transition-all duration-300 ${
                          mode === m
                            ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-md shadow-cyan-400/40'
                            : 'text-cyan-300 hover:text-white hover:bg-cyan-200/10'
                        }`}
                    >
                      {m === 'server' ? 'Server' : 'Client'}
                    </button>
                  ))}
                </div>
              </div>
              <PitchSlider value={semitone} onChange={setSemitone} />
              {/* レコーダー */}
              <Recorder
                onStart   ={handleRecordStart}
                onStop    ={handleRecordStop}
                onRecorded={blob => setRawBlob(blob)}
              />

              {/* 録音後 UI */}
              {sourceURL && (
                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-cyan-400/30 mt-3 sm:mt-4">
                  <AudioPreview label="変換前" src={sourceURL} />

                  <div className="flex justify-center pt-1 sm:pt-2">
                    <button
                      onClick={handleInfer}
                      disabled={stage !== 'idle'}
                      className="px-6 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base
                                 bg-gradient-to-r from-cyan-400 to-sky-500
                                 rounded-full text-black font-bold
                                 hover:from-cyan-500 hover:to-blue-400
                                 transition-all duration-300 transform hover:scale-105
                                 shadow-lg shadow-cyan-400/50
                                 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      声を変換！
                    </button>
                  </div>

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
                          className="px-4 py-1.5 text-[11px] sm:px-6 sm:py-2 sm:text-xs
                                     font-medium text-cyan-200 border border-cyan-300/60
                                     rounded-full hover:bg-cyan-400/10 hover:text-cyan-100
                                     transition-all duration-300"
                        >
                          最初からやり直す
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ——— キャラクター ——— */}
            <div
              className={`relative flex-1 flex items-center justify-center order-1 md:order-2
                           min-h-[200px] sm:min-h-[250px] md:min-h-[300px] bg-black/20
                           rounded-lg p-2 md:p-0
                           ${disclaimerAck ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => {
                if (!disclaimerAck) return;
                setPopOpen(true);
                setPopHintShown(false);
              }}
            >
              <CharacterHintBubble visible={disclaimerAck && popHintShown} />
              <CharacterView stage={stage} />
            </div>

            {/* Information */}
            <div className="absolute right-3 bottom-3 z-30">
              <Infomation />
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
