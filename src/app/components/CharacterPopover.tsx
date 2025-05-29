// components/CharacterPopover.tsx
'use client';

import { motion } from 'framer-motion';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CharacterPopover({ visible, onClose }: Props) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative bg-white rounded-3xl shadow-2xl border-2 border-rose-200
                   p-6 max-w-sm w-full"
      >
        {/* アイキャッチ */}
        <img
          src="/tsukuyomichan_image/tukuyomi3_0000.png"
          alt="つくよみちゃん"
          className="w-28 h-28 object-contain mx-auto drop-shadow mb-4"
          draggable={false}
        />

        <h2 className="text-xl font-bold text-rose-600 text-center mb-3">
          つくよみちゃん
        </h2>

        <p className="text-sm text-gray-700 leading-relaxed space-y-1">
          大抵のことは笑顔でこなす、健気で優しい女の子！
          <br />■ 年齢：人間で言うと 14 歳くらい
          <br />■ 身長：148 cm（可変）
          <br />■ 性格：素直で頑張り屋
          <br />■ 特技：営業スマイル
          <br />■ 口調：敬語／一人称は「私」
          <br />■ 座右の銘：鏡花水月
          <br />■ 好きな食べ物：絵に描いた餅
          <br />■ 誕生日：2017-11-28
          <br />■ 公式 CV：夢前黎（他の人でも OK!）
        </p>

        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-gradient-to-r
                       from-rose-400 to-pink-500 text-white text-sm font-bold
                       shadow-md hover:scale-105 transition-transform"
          >
            とじる
          </button>
        </div>
      </motion.div>
    </div>
  );
}
