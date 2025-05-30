"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroProps {
  visible: boolean;
  onFinished?: () => void;
}

/**
 * Intro – PC / モバイル対応版
 *
 * ・モバイル（pointer: coarse & max-width ≤ 768 px）では
 *   グラデーション背景・大型ブラーを省き、月＋文字アニメのみ描画。
 * ・PC では従来のリッチ効果を維持。
 */
export default function Intro({ visible, onFinished }: IntroProps) {
  /* ──────────── モバイル判定 ──────────── */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(
      "(pointer: coarse) and (max-width: 768px)"
    );
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* ──────────── JSX ──────────── */
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          /* 背景 */
          className={
            isMobile
              ? "fixed inset-0 z-[9999] flex items-center justify-center bg-black"
              : "fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-blue-900 via-indigo-900/80 to-pink-100/70"
          }
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            transition: { duration: 0.9, ease: "easeInOut" },
          }}
          transition={{ duration: 1.0 }}
          onAnimationComplete={(def) => {
            if (def === "exit" && onFinished) onFinished();
          }}
        >
          {/* ──────────── 月 ──────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 60 }}
            animate={{
              opacity: isMobile ? 0.24 : 0.18,
              scale: [0.7, 1.12, 1],
              y: [60, 0],
              transition: {
                delay: 0.15,
                duration: 1.2,
                ease: "easeOut",
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.85,
              y: 60,
              transition: { duration: 0.6 },
            }}
            className="absolute left-1/2 top-1/4 -translate-x-1/2"
            style={{
              width: "360px",
              height: "360px",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at 60% 40%, #fffde4 80%, #fbc2eb33 100%, transparent 100%)",
              boxShadow: isMobile
                ? "0 0 80px 40px #fefefe55"
                : "0 0 160px 60px #fefefe80, 0 0 200px 100px #fbc2eb60",
            }}
          />

          {/* ──────────── テキスト ──────────── */}
          <div className="relative flex flex-col items-center justify-center space-y-2 select-none z-10">
            {/* 行 1 */}
            <motion.span
              initial={{
                opacity: 0,
                scale: 1.3,
                rotate: -10,
                y: 36,
                filter: "blur(5px)",
              }}
              animate={{
                opacity: 1,
                scale: [1.3, 0.98, 1.13, 1],
                rotate: [-10, 12, 0, 0],
                y: [36, -5, 2, 0],
                filter: ["blur(5px)", "blur(0px)", "blur(0px)", "blur(0px)"],
                transition: {
                  duration: 1.05,
                  ease: "easeOut",
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
                y: 30,
                transition: { duration: 0.8 },
              }}
              className={
                isMobile
                  ? "text-[2rem] font-extrabold"
                  : "text-[2.8rem] sm:text-[4.7rem] font-extrabold"
              }
              style={{
                color: "#fff",
                WebkitTextStroke: isMobile ? "1.8px #fbc2eb" : "2.7px #fbc2eb",
                fontFamily:
                  "'Yomogi','Sawarabi Mincho','Kosugi Maru',cursive,sans-serif",
                letterSpacing: "0.04em",
                textShadow: isMobile
                  ? "0 6px 18px #a7f3f776"
                  : `0 8px 28px #a7f3f7cc,
                     0 0px 8px #fff5,
                     0 2px 20px #f472b650`,
                filter: isMobile
                  ? "drop-shadow(0 0 24px #fbc2eb66)"
                  : "drop-shadow(0 0 36px #fbc2eb90)",
              }}
            >
              なろうよ
            </motion.span>

            {/* 行 2 */}
            <motion.span
              initial={{
                opacity: 0,
                scale: 0.82,
                rotate: 15,
                y: 62,
                filter: "blur(8px)",
              }}
              animate={{
                opacity: 1,
                scale: [0.82, 1.2, 0.99, 1.04],
                rotate: [15, -8, 2, 0],
                y: [62, 2, 7, 0],
                filter: ["blur(8px)", "blur(0px)", "blur(0px)", "blur(0px)"],
                transition: {
                  delay: 0.28,
                  duration: 1.09,
                  ease: "easeOut",
                },
              }}
              exit={{
                opacity: 0,
                scale: 1.12,
                y: 32,
                transition: { duration: 0.8 },
              }}
              className={
                isMobile
                  ? "text-[1.2rem] font-extrabold"
                  : "text-[1.7rem] sm:text-[2.7rem] font-extrabold"
              }
              style={{
                color: "#fff",
                WebkitTextStroke: isMobile ? "1.4px #f9a8d4" : "2px #f9a8d4",
                fontFamily:
                  "'Yomogi','Sawarabi Mincho','Kosugi Maru',cursive,sans-serif",
                letterSpacing: "0.10em",
                textShadow: isMobile
                  ? "0 6px 24px #f9a8d46b"
                  : `0 8px 44px #f9a8d480,
                     0 0px 22px #fff8,
                     0 3px 12px #f472b650`,
                filter: isMobile
                  ? "drop-shadow(0 0 28px #fbc2eb77)"
                  : "drop-shadow(0 0 44px #fbc2eb99)",
              }}
            >
              つくよみちゃん！
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
