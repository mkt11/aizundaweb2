import { motion } from 'framer-motion';

interface AudioPreviewProps {
  label: string;
  src: string;
}

export default function AudioPreview({ label, src }: AudioPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center p-3 bg-black/20 backdrop-blur-xl rounded-2xl border border-cyan-400/30 shadow-2xl w-full"
    >
      <span className="text-xl font-bold text-cyan-300 mb-2">{label}</span>
      <audio
        controls
        src={src}
        className="w-full rounded-lg bg-slate-800/50
          [&::-webkit-media-controls-panel]:bg-slate-800/70
          [&::-webkit-media-controls-play-button]:text-cyan-400"
      />
    </motion.div>
  );
}
