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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.6 } }}
          transition={{ duration: 0.6 }}
          onAnimationComplete={(def) => {
            if (def === "exit" && onFinished) onFinished();
          }}
        >
          <div className="relative flex items-end space-x-2">
            <motion.span
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-5xl sm:text-7xl font-extrabold text-white tracking-wider drop-shadow-xl"
            >
              AI ZUNDA WEB
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.9, ease: "easeOut" }}
              className="text-2xl sm:text-8xl font-extrabold text-green-400 drop-shadow-lg"
              style={{ lineHeight: 0.9 }}
            >
              2
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
