import '@/styles/globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'なろうよつくよみちゃん！',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* ▼ここにGoogle Fontsなどを追加 */}
        <link href="https://fonts.googleapis.com/css2?family=Yomogi&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Kiwi+Maru:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Yomogi&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center p-4">
          {children}
        </div>
      </body>
    </html>
  );
}
