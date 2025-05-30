import '@/styles/globals.css';
import { ReactNode } from 'react';
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: '【AI音声変換】なろうよ つくよみちゃん！｜AIボイスチェンジャーWebアプリ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="AIずんだもんの後継作品！？AI技術であなたの声を人気キャラクター『つくよみちゃん』の声に変換！Webブラウザで手軽にAI声質変換が無料体験できるAI音声変換アプリ。歌声やピッチ調整も対応。安全・高品質なAIボイスチェンジャーを今すぐ体験しよう。" />
        {/* ▼ここにGoogle Fontsなどを追加 */}
        <link href="https://fonts.googleapis.com/css2?family=Yomogi&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Kiwi+Maru:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Yomogi&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center p-4">
          {children}
        </div>
        <Analytics/>
      </body>
    </html>
  );
}
