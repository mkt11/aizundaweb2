import '@/styles/globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'AIZundaWeb2',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center p-4">
          {children}
        </div>
      </body>
    </html>
  );
}
