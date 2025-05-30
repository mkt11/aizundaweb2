// scripts/fetch-models.js

const fs   = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

async function downloadModel(s3, bucket, key, tmpPath) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(tmpPath);
    res.Body.pipe(ws);
    res.Body.on('error', reject);
    ws.on('finish', resolve);
  });
}

async function main() {
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, MODEL_BUCKET } = process.env;
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !MODEL_BUCKET) {
    console.log('Skip fetching models: 必要な環境変数が未設定です');
    return;
  }

  const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId:     AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  // 一時保存ディレクトリ
  const tmpDir = path.resolve(__dirname, '../.model_tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  // 配置先ディレクトリ
  fs.mkdirSync(path.resolve(__dirname, '../public/model'),   { recursive: true });
  fs.mkdirSync(path.resolve(__dirname, '../server_model'),   { recursive: true });

  // S3 のキーと、ローカル配置先をまとめて定義
  const models = [
    {
      key:  'models/hubert_base.onnx',   // S3 側の共通キー
      files: [
        'public/model/hubert_base.onnx',
        'server_model/hubert_base.onnx',
      ]
    },
    {
      key:  'models/tsukuyomi-chan.onnx',
      files: [
        'public/model/tsukuyomi-chan.onnx',
        'server_model/tsukiyomi-chan.onnx',
      ]
    }
  ];

  for (const m of models) {
    const tmpPath = path.join(tmpDir, path.basename(m.key));
    console.log(`Downloading ${m.key} → ${tmpPath}`);
    await downloadModel(s3, MODEL_BUCKET, m.key, tmpPath);

    // ダウンロードした一時ファイルを、public/model と server_model にコピー
    for (const destRel of m.files) {
      const destAbs = path.resolve(__dirname, `../${destRel}`);
      fs.copyFileSync(tmpPath, destAbs);
      console.log(`  Copied → ${destRel}`);
    }
  }

  // 一時ディレクトリを消す（必要なら）
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('✅ モデルのダウンロード＆配置完了');
}

main().catch(err => {
  console.error('❌ モデル取得中にエラー発生:', err);
  process.exit(1);
});
