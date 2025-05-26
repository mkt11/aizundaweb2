import { motion } from 'framer-motion';

interface ProcessingStatusProps {
  message: string;
}

export default function ProcessingStatus({ message }: ProcessingStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center space-y-4 w-full"
    >
      <div className="flex items-center space-x-3 text-yellow-400 text-lg">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold">{message}</span>
      </div>
      <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full animate-pulse" />
      </div>
    </motion.div>
  );
}