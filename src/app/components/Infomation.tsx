"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

export default function Infomation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-3 right-3 z-50">
      {/* Info ボタン */}
      <button
        className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-md flex items-center justify-center hover:scale-105 transition-transform outline-none focus:ring-2 focus:ring-green-400"
        onClick={() => setOpen(true)}
        aria-label="アプリ情報を表示"
        tabIndex={0}
      >
        <Info className="w-6 h-6 text-white" />
      </button>

      {/* モーダル */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/50"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
              className="relative bg-white/95 text-gray-900 rounded-xl p-6 w-full max-w-lg m-6 shadow-2xl border border-green-500/30"
              onClick={(e) => e.stopPropagation()} // モーダル外クリックで閉じる
            >
              <button
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="閉じる"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" width={20} height={20}>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
                  <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <h2 className="text-xl font-bold mb-2 text-green-700">naryouyoTsukuyomi-chan!</h2>
              <p className="mb-3 text-sm">
                本アプリは、AI技術を活用した音声変換・合成体験が可能なWebサービスです。音声を録音し、サーバまたはローカルでAI推論による音声変換を実行できます。
              </p>
              <ul className="mb-3 text-xs list-disc pl-5 text-gray-800">
                <li>主要技術: ONNX, RVC, WebAudio, Framer Motion, TailwindCSS</li>
              </ul>
              <div className="mt-2 mb-2 text-xs text-gray-600 border-t pt-2">
                <b>ライセンス</b>
                <br></br>
                <span className="ml-1">
                声質変換：つくよみちゃん公式RVCモデル<br></br>
                </span>
                <span className="ml-1">
                イラスト素材：えみゃコーラ 様（https://tyc.rei-yumesaki.net/material/illust/）
                </span>
              </div>
              <div className="text-right mt-2">
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
