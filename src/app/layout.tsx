// src/app/layout.tsx
import '../styles/globals.css';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <title>RVC 音声変換 Web</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
