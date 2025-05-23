interface AudioPlayerProps {
  src: string;
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  return (
    <audio controls src={src} className="w-full mt-2" />
  );
}
