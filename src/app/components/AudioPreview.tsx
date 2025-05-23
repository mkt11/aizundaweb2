// src/components/AudioPreview.tsx
interface AudioPreviewProps {
    label: string;
    src: string;
  }
  
  export default function AudioPreview({ label, src }: AudioPreviewProps) {
    return (
      <div className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-sm rounded-lg w-full">
        <span className="text-lg font-semibold text-gray-300 mb-2">{label}</span>
        <audio controls src={src} className="w-full" />
      </div>
    );
  }
  