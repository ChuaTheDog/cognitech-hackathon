import { NextResponse } from 'next/server';
// highlight-next-line
import { synthesizeSpeech } from '@/lib/elevenlabs.service'; // We only need the TTS service here

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');
    const prompt = formData.get('prompt');

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: 'Missing required file field: image' },
        { status: 400 }
      );
    }

    const metadata = {
      ok: true,
      prompt: typeof prompt === 'string' ? prompt : '',
      image: {
        name: image.name,
        type: image.type,
        size: image.size,
      },
    };

    return NextResponse.json(metadata, { status: 200 });
  } catch (error) {
    console.error('Error parsing form-data for start route:', error);
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 400 }
    );
  }
}