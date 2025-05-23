interface ProcessingStatusProps {
  message: string;
}

export default function ProcessingStatus({ message }: ProcessingStatusProps) {
  return (
    <div className="flex items-center space-x-2 p-3 bg-yellow-500/20 text-yellow-200 rounded-lg">
      <svg className="w-5 h-5 animate-spin" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
