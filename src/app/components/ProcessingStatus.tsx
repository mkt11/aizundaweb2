// src/components/ProcessingStatus.tsx
interface Props {
    message: string;
  }
  
  export default function ProcessingStatus({ message }: Props) {
    return <p className="mt-2 text-gray-600">{message}</p>;
  }
  