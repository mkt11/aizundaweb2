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
        <ul className="list-disc pl-5 text-xs text-gray-800 space-y-3">
          <li>
            本アプリケーションは、「声質変換AIをどなたでも手軽にご利用いただくこと」を目的としたデモンストレーションAppです。
            声質変換の可能性を体験いただくことを主眼としています。
          </li>
          <li>
            本ソフトウェアは体験用途向けであり、実運用目的でのご利用には適しておりません。
            <span className="text-red-600">変換後の音声のインターネット上への公開や再配布は禁止しております</span>
          </li>
          <li>
          本サービスの利用により発生した損害について、サービス提供者は責任を負わないものとします。
          また、出力した音声を次の目的で使用することを禁止します。<br/>
          ■人を批判・攻撃すること。（「批判・攻撃」の定義は、<a href="https://tyc.rei-yumesaki.net/about/terms/" target="_blank" style={{ color: '#2563eb' }}>つくよみちゃんキャラクターライセンス</a>に準じます）<br/>
          ■特定の政治的立場・宗教・思想への賛同または反対を呼びかけること。<br/>
          ■刺激の強い表現をゾーニングなしで公開すること。<br/>
          ■他者に対して二次利用（素材としての利用）を許可する形で公開すること。<br/>
          </li>
          <li>
          <span className="text-red-600">本ソフトウェアの音声合成には、フリー素材キャラクター「つくよみちゃん」（© Rei Yumesaki）が無料公開している音声データを使用しています。</span>
          <br/>
          ■つくよみちゃんコーパス（CV.夢前黎）
          https://tyc.rei-yumesaki.net/material/corpus/
          <br/>
          ■つくよみちゃんUTAU音源（CV.夢前黎）
          https://tyc.rei-yumesaki.net/material/utau/
          <br/>
          ■イラスト：みるくぱんだ＠お仕事期日要相談 様<br/>
          URL https://drive.google.com/file/d/1f10JOmpR2w4Px4atoBvjMd-t6v5zDaV8/view?usp=sharing
          <br/>
          ■つくよみちゃん公式サイト
          https://tyc.rei-yumesaki.net
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
