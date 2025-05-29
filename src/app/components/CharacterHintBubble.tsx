// components/CharacterHintBubble.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';      // ※ icon ライブラリ lucide-react を想定

interface Props {
  visible: boolean;
}

export default function CharacterHintBubble({ visible }: Props) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit   ={{
        opacity: 0,
        y: 10,
        scale: 0.8,
        transition: { duration: 0.25 },
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 18,
      }}
      className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none
                 animate-[bounce_2.4s_ease-in-out_infinite]"
    >
      {/* 吹き出し本体 */}
      <div className="relative bg-gradient-to-r from-pink-200 via-rose-200 to-pink-200
                      text-rose-800 text-[11px] sm:text-xs font-semibold
                      py-2 px-4 rounded-full shadow-lg shadow-rose-300/50">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
          <span className="whitespace-nowrap leading-snug">
            私をタップして&nbsp;
            <span className="hidden sm:inline">わたしのことを知ってね！</span>
            <span className="inline sm:hidden">みてね！</span>
          </span>
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
        </div>

        {/* 矢印 */}
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0
                        border-l-8 border-l-transparent
                        border-r-8 border-r-transparent
                        border-t-8 border-t-pink-200" />
      </div>
    </motion.div>
  );
}
