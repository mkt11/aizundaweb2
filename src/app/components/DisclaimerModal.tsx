// components/DisclaimerModal.tsx
import React from "react";

interface DisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DisclaimerModal({ visible, onClose }: DisclaimerModalProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-xl p-7 max-w-lg w-full border border-green-400/50">
        <h2 className="text-lg font-bold mb-3 text-green-700">免責事項・ご利用にあたってのご案内</h2>
        <ul className="list-disc pl-5 text-sm text-gray-800 space-y-3">
          <li>
            本アプリケーションは、「声質変換AIをどなたでも手軽にご利用いただくこと」を目的としたデモンストレーションAppです。
            声質変換の可能性を体験いただくことを主眼としています。
          </li>
          <li>
            本ソフトウェアは体験用途向けであり、実運用目的でのご利用には適しておりません。
            変換後の音声のインターネット上への公開や再配布は固くご遠慮ください。
          </li>
          <li>
            本アプリケーションは
            <a
              href="https://zunko.jp/con_ongen_kiyaku.html"
              className="underline text-blue-600 hover:text-blue-700 mx-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              VOICEVOX:ずんだもん
            </a>
            および
            <a
              href="https://zunko.jp/guideline.html"
              className="underline text-blue-600 hover:text-blue-700 mx-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              キャラクターの利用規約
            </a>
            を遵守しております。
            万一、権利上の問題が確認された場合は、速やかに公開停止等の対応を行いますので、
            ご意見・ご指摘がございましたら、
            <a
              href="mkt11official@gmail.com"
              className="underline text-blue-600 hover:text-blue-700 ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              こちら
            </a>
            までご連絡ください。
          </li>
        </ul>
        <div className="flex justify-center mt-7">
          <button
            onClick={onClose}
            className="px-7 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 font-semibold transition"
            autoFocus
          >
            同意して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
