// src/components/ProcessingStatus.tsx
interface ProcessingStatusProps {
  message: string;
}

export default function ProcessingStatus({ message }: ProcessingStatusProps) {
  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center space-x-2 text-yellow-300">
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" />
        </svg>
        <span>{message}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div className="bg-yellow-400 h-full animate-progress"></div>
      </div>
    </div>
  );
}
