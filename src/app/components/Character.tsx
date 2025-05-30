// components/Character.tsx
'use client';

import { motion } from 'framer-motion';

type Stage = 'idle' | 'recording' | 'inference';

const images: Record<Stage, string> = {
  idle:      '/tsukuyomichan_image/tukuyomi3_0000.png',
  recording: '/tsukuyomichan_image/tukuyomi3_0001.png',
  inference: '/tsukuyomichan_image/tukuyomi3_0002.png',
};

interface CharacterProps {
  stage: Stage;
}

export default function Character({ stage }: CharacterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: ['0%', '-7%', '0%'],
      }}
      transition={{
        opacity: { duration: 0.8 },
        scale:   { duration: 0.8 },
        y:       { duration: 10, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="w-100 mx-auto select-none pointer-events-none py-0 sm:py-0 h-auto sm:h-130"
    >
      <img
        src={images[stage]}
        alt="キャラクター"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </motion.div>
  );
}
