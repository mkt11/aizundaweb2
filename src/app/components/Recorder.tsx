'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RecorderProps {
  onRecorded: (blob: Blob) => void;
  maxDuration?: number;
}

export default function Recorder({ onRecorded, maxDuration = 10 }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timerId = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerId.current = window.setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= maxDuration) { 
            stop(); 
            return e + 1; 
          }
          return e + 1;
        });
      }, 1000);
    }
    return () => { 
      if (timerId.current !== null) clearInterval(timerId.current); 
    };
  }, [isRecording, maxDuration]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/wav' });
        onRecorded(blob);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      setElapsed(0);
    } catch (err) {
      console.error('録音エラー:', err);
    }
  };

  const stop = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="flex flex-col items-center justify-center p-4 bg-black/20 backdrop-blur-xl rounded-2xl border border-green-500/20 shadow-2xl w-full"
    >
      <button
        onClick={isRecording ? stop : start}
        className={`px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/50'
            : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-green-500/50'
        }`}
      >
        {isRecording ? '録音停止' : '録音開始'}
      </button>
      {isRecording && (
        <div className="mt-4 text-center">
          <div className="text-lg font-semibold text-green-400">
            録音中... {elapsed}s / {maxDuration}s
          </div>
          <div className="w-64 bg-gray-800/50 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-1000"
              style={{ width: `${(elapsed / maxDuration) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}