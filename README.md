# なろうよ つくよみちゃん！
<p align="center">
  <img width="761" alt="image" src="https://github.com/user-attachments/assets/5b53a5d2-14aa-45c5-a8a3-4d3c446319c2" width="480"/>
</p>
AI技術を活用した**音声変換・合成体験**ができるWebアプリです。  
録音したあなたの声を「つくよみちゃん」の声に変換できます！

---

## 🚀 特徴

- **録音した音声をAIで変換**  
  HuBERT × RVCモデルを用いて、あなたの声を「つくよみちゃん」ボイスに変換します。
- **Web上で完結**  
  ブラウザだけで動作。サーバ/ローカル推論を両対応。
- **ピッチ調整や歌声変換も可能**  
  男性は+12、女性は±0程度のピッチ推奨。歌もOK！
- **美しいUI/UX**  
  Framer MotionやTailwindCSSによるサイバーで可愛いデザイン。

---

## 🛠️ 技術スタック

- **フロントエンド**: Next.js, React, TypeScript, TailwindCSS, Framer Motion, WebAudio API
- **AI/音声変換**: ONNX, RVC, HuBERT, onnxruntime-web/node
- **バックエンド**: FastAPI, Python, torch, torchaudio, pyworld, fairseq ほか
- **その他**: MUI, Lucide Icons, S3, Particles.js など

---

## 📦 セットアップ方法

### 1. 必要なもの

- Node.js 22.x
- Python 3.8+
- (推奨) Chrome/Edgeなどの最新ブラウザ

### 2. インストール

```bash
git clone https://github.com/yourname/narouyoTsukuyomi-chan.git
cd narouyoTsukuyomi-chan
npm install
pip install -r requirements.txt
```

### 3. 開発サーバ起動

```bash
npm run dev
# または
yarn dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

---

## 🎤 使い方

1. 「録音」ボタンで自分の声を録音
2. ピッチを調整（男性は+12、女性は±0程度を推奨）
3. 「変換」ボタンでAIがつくよみちゃんボイスに変換
4. 変換後の音声を再生・ダウンロード

---

## ⚠️ 注意・免責事項

- 本アプリは**声質変換AIのデモ**です。実運用はできません。
- 変換後の音声の**公開・再配布は禁止**です。
- 本サービス利用による損害等について、提供者は一切責任を負いません。
- 本ソフトウェアの音声合成には、フリー素材キャラクター「つくよみちゃん」（© Rei Yumesaki）が無料公開している音声データを使用しています。**mkt11が作成したオリジナルキャラクターではない**点をご留意ください。

---

## 📝 ライセンス・クレジット

- **キャラクター・音声**:  
  [つくよみちゃん公式サイト](https://tyc.rei-yumesaki.net)    
  [つくよみちゃんコーパス](https://tyc.rei-yumesaki.net/material/corpus/)  
  [つくよみちゃんUTAU音源](https://tyc.rei-yumesaki.net/material/utau/)

- **イラスト**:  
  みるくぱんだ＠お仕事期日要相談 様   © Rei Yumesaki / みるくぱんだ
  [イラスト配布URL](https://drive.google.com/file/d/1f10JOmpR2w4Px4atoBvjMd-t6v5zDaV8/view?usp=sharing)

---

## 💡 貢献・フィードバック

バグ報告・機能要望・プルリクエスト歓迎です！  
（ただしキャラクター利用規約・AI倫理にご配慮ください）

---

## 🐾 Special Thanks

- つくよみちゃん公式・夢前黎様
- みるくぱんだ様
- RVC, HuBERT, ONNX, FastAPI, Next.js, TailwindCSS, Framer Motion 各OSSコミュニティ

---

「なろうよ、つくよみちゃん！」
