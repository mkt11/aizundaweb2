// components/Recorder.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RecorderProps {
  /** 録音完了後、Blob を返す */
  onRecorded: (blob: Blob) => void;
  /** 録音開始時（引数なし） */
  onStart?  : () => void;
  /** 録音停止時（引数なし） */
  onStop?   : () => void;
  /** 最大録音時間（秒） */
  maxDuration?: number;
}

export default function Recorder({
  onRecorded,
  onStart,
  onStop,
  maxDuration = 5,
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed,     setElapsed]     = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks        = useRef<BlobPart[]>([]);
  const timerId       = useRef<number | null>(null);

  /* ──────────────── タイマー ──────────────── */
  useEffect(() => {
    if (isRecording) {
      timerId.current = window.setInterval(() => {
        setElapsed(e => {
          if (e + 1 >= maxDuration) {
            stop();                     // 上限到達で自動停止
            return e + 1;
          }
          return e + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId.current !== null) clearInterval(timerId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, maxDuration]);

  /* ──────────────── 録音開始 ──────────────── */
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current        = [];

      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        onRecorded(blob);
        onStop?.();
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setElapsed(0);
      onStart?.();
    } catch (err) {
      console.error('録音エラー:', err);
    }
  };

  /* ──────────────── 録音停止 ──────────────── */
  const stop = () => {
    if (!isRecording) return;
    mediaRecorder.current?.stop();
    setIsRecording(false);
    if (timerId.current !== null) {
      clearInterval(timerId.current);
      timerId.current = null;
    }
  };

  /* ──────────────── UI ──────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="flex flex-col items-center justify-center p-4
                 bg-black/20 backdrop-blur-xl rounded-2xl
                 border border-cyan-400/30 shadow-2xl w-full"
    >
      <button
        onClick={isRecording ? stop : start}
        className={`px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
          isRecording
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-400/50'
            : 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-blue-400 text-black shadow-cyan-400/50'
        }`}
      >
        {isRecording ? '録音停止' : '録音開始'}
      </button>

      {isRecording && (
        <div className="mt-4 text-center">
          <div className="text-lg font-semibold text-cyan-300 drop-shadow">
            録音中… {elapsed}s / {maxDuration}s
          </div>
          <div className="w-64 bg-slate-800/50 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-sky-500 h-full transition-all duration-1000"
              style={{ width: `${(elapsed / maxDuration) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
