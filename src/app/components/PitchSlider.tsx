// src/components/PitchSlider.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PitchSliderProps {
  /** 現在のピッチシフト量（半音） */
  value: number;
  /** 値が変わったときに呼ばれるハンドラ */
  onChange: (value: number) => void;
}

export default function PitchSlider({
  value,
  onChange
}: PitchSliderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center space-y-2 p-4
                 bg-black/20 backdrop-blur-xl rounded-2xl
                 border border-cyan-400/30 shadow-2xl w-full"
    >
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-sm font-bold text-pink-300">Pitch Shift</span>
        <span className="text-sm font-semibold text-pink-200">
          {value} semitones
        </span>
      </div>
      <input
        id="pitch-slider"
        type="range"
        min={-24}
        max={24}
        step={1}
        value={value}
        onChange={e => onChange(parseInt(e.currentTarget.value, 10))}
        className="w-full h-2 rounded-lg
                   accent-pink-400 hover:accent-pink-500
                   transition-all duration-200"
      />
    </motion.div>
  );
}
