// src/components/FileUploader.tsx
'use client';

import { ChangeEvent } from 'react';

interface Props {
  onFileReady: (file: File) => void;
}

export default function FileUploader({ onFileReady }: Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileReady(file);
  };

  return <input type="file" accept="audio/*" onChange={handleChange} />;
}
