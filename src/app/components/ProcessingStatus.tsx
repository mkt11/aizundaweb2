// src/components/ProcessingStatus.tsx
'use client';

import { motion } from 'framer-motion';

interface ProcessingStatusProps {
  /** 処理中メッセージ */
  message: string;
}

export default function ProcessingStatus({ message }: ProcessingStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center p-4
                 bg-black/20 backdrop-blur-xl rounded-2xl
                 border border-cyan-400/30 shadow-2xl w-full"
    >
      <div
        className="w-6 h-6
                   border-2 border-cyan-400 border-t-transparent
                   rounded-full animate-spin"
      />
      <span className="ml-3 font-semibold text-cyan-200">
        {message}
      </span>
    </motion.div>
  );
}
