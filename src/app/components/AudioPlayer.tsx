// src/components/AudioPlayer.tsx
interface Props {
    src: string;
  }
  
  export default function AudioPlayer({ src }: Props) {
    return <audio controls src={src} className="mt-4 w-full" />;
  }
  