// Next.js App Router の Route Handler
import { NextRequest, NextResponse } from 'next/server';
import { inferRvc } from '@/server/utils/onnxServer';

export const runtime = 'nodejs'; // node 環境で実行

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as Blob;
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    // バイナリ推論、WAV バッファを返す
    const arrayBuffer = await file.arrayBuffer();
    const wavBuffer = await inferRvc(new Uint8Array(arrayBuffer));
    return new NextResponse(wavBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/wav' },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
