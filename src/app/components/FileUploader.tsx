'use client';

interface FileUploaderProps {
  onFileReady: (file: File) => void;
}

export default function FileUploader({ onFileReady }: FileUploaderProps) {
  return (
    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:border-white transition-colors">
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileReady(file);
        }}
      />
      <p className="text-gray-300">wavファイルをここにドロップ、またはクリックして選択</p>
    </label>
  );
}
