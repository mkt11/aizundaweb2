// scripts/fetch-models.js

const fs   = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// S3 から key を取得し、dest に保存するヘルパー
async function downloadModel(s3, bucket, key, dest) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);

  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(dest);
    res.Body.pipe(stream);
    res.Body.on('error', reject);
    stream.on('finish', resolve);
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

  // ディレクトリ準備
  fs.mkdirSync(path.resolve(__dirname, '../public/model'), { recursive: true });
  fs.mkdirSync(path.resolve(__dirname, '../server_model'), { recursive: true });

  // ダウンロード項目
  const items = [
    { key: 'public/model/hubert_base.onnx',    dest: 'public/model/hubert_base.onnx' },
    { key: 'public/model/tsukuyomi-chan.onnx', dest: 'public/model/tsukuyomi-chan.onnx' },
    { key: 'server_model/hubert_base.onnx',    dest: 'server_model/hubert_base.onnx' },
    { key: 'server_model/tsukuyomi-chan.onnx', dest: 'server_model/tsukuyomi-chan.onnx' },
  ];

  for (const { key, dest } of items) {
    console.log(`Downloading ${key} → ${dest} ...`);
    await downloadModel(s3, MODEL_BUCKET, key, path.resolve(__dirname, `../${dest}`));
  }

  console.log('✅ モデルのダウンロード完了');
}

main().catch(err => {
  console.error('❌ モデルダウンロード中にエラー発生:', err);
  process.exit(1);
});
