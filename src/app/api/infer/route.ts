import { NextRequest, NextResponse } from 'next/server'
import { inferRvc } from '@/server/utils/onnxServer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as Blob;
    const semitone = parseInt(form.get('semitone') as string) || 0;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    const buf = await file.arrayBuffer();

    const result = await inferRvc(new Uint8Array(buf), semitone);

    return new NextResponse(result, {
      status: 200,
      headers: { 'Content-Type': 'audio/wav' }
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error('API infer error:', e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
