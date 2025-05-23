// src/components/Recorder.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface RecorderProps {
  onRecorded: (blob: Blob) => void;
  maxDuration?: number;
}

export default function Recorder({ onRecorded, maxDuration = 10 }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed]         = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks        = useRef<BlobPart[]>([]);
  const timerId       = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerId.current = window.setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= maxDuration) { stop(); return e + 1; }
          return e + 1;
        });
      }, 1000);
    }
    return () => { if (timerId.current !== null) clearInterval(timerId.current); };
  }, [isRecording, maxDuration]);

  const start = async () => {
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
  };

  const stop = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-xl w-full">
      <button
        onClick={isRecording ? stop : start}
        className={`px-6 py-3 rounded-full font-bold transition ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-400 hover:bg-green-500'
        }`}
      >
        {isRecording ? '録音停止' : '録音開始'}
      </button>
      {isRecording && (
        <span className="mt-2 text-sm text-gray-200">
          録音中… {elapsed}s / {maxDuration}s
        </span>
      )}
    </div>
  );
}
