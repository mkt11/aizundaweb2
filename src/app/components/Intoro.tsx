"use client";
import { motion, AnimatePresence } from "framer-motion";

interface IntroProps {
  visible: boolean;
  onFinished?: () => void;
}

export default function Intro({ visible, onFinished }: IntroProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-blue-900 via-indigo-900/80 to-pink-100/70"
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
          {/* 月 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 60 }}
            animate={{
              opacity: 0.18,
              scale: [0.7, 1.12, 1],
              y: [60, 0],
              transition: { delay: 0.15, duration: 1.2, ease: "easeOut" }
            }}
            exit={{ opacity: 0, scale: 0.85, y: 60, transition: { duration: 0.6 } }}
            className="absolute left-1/2 top-1/4 -translate-x-1/2"
            style={{
              width: "360px",
              height: "360px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 60% 40%, #fffde4 80%, #fbc2eb33 100%, transparent 100%)",
              boxShadow: "0 0 160px 60px #fefefe80, 0 0 200px 100px #fbc2eb60"
            }}
          />

          {/* テキスト */}
          <div className="relative flex flex-col items-center justify-center space-y-2 select-none z-10">
            <motion.span
              initial={{ opacity: 0, scale: 1.3, rotate: -10, y: 36, filter: "blur(5px)" }}
              animate={{
                opacity: 1,
                scale: [1.3, 0.98, 1.13, 1],
                rotate: [-10, 12, 0, 0],
                y: [36, -5, 2, 0],
                filter: ["blur(5px)", "blur(0px)", "blur(0px)", "blur(0px)"],
                transition: { duration: 1.05, ease: "easeOut" }
              }}
              exit={{ opacity: 0, scale: 0.98, y: 30, transition: { duration: 0.8 } }}
              className="text-[2.8rem] sm:text-[4.7rem] font-extrabold"
              style={{
                color: "#fff",
                WebkitTextStroke: "2.7px #fbc2eb",
                fontFamily: "'Yomogi','Sawarabi Mincho','Kosugi Maru',cursive,sans-serif",
                letterSpacing: "0.04em",
                textShadow: `
                  0 8px 28px #a7f3f7cc, 
                  0 0px 8px #fff5,
                  0 2px 20px #f472b650,
                  0 0px 0px #fff
                `,
                filter: "drop-shadow(0 0 36px #fbc2eb90)",
              }}
            >
              なろうよ
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.82, rotate: 15, y: 62, filter: "blur(8px)" }}
              animate={{
                opacity: 1,
                scale: [0.82, 1.2, 0.99, 1.04],
                rotate: [15, -8, 2, 0],
                y: [62, 2, 7, 0],
                filter: ["blur(8px)", "blur(0px)", "blur(0px)", "blur(0px)"],
                transition: { delay: 0.28, duration: 1.09, ease: "easeOut" }
              }}
              exit={{ opacity: 0, scale: 1.12, y: 32, transition: { duration: 0.8 } }}
              className="text-[1.7rem] sm:text-[2.7rem] font-extrabold"
              style={{
                color: "#fff",
                WebkitTextStroke: "2px #f9a8d4",
                fontFamily: "'Yomogi','Sawarabi Mincho','Kosugi Maru',cursive,sans-serif",
                letterSpacing: "0.10em",
                textShadow: `
                  0 8px 44px #f9a8d480,
                  0 0px 22px #fff8,
                  0 3px 12px #f472b650,
                  0 0px 0px #fff
                `,
                filter: "drop-shadow(0 0 44px #fbc2eb99)",
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
