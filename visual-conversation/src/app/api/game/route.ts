import { NextRequest, NextResponse } from 'next/server';
import { handleVisualStart } from '@/lib/visual-ai-service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as Blob | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file found.' }, { status: 400 });
    }
    
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Call the new start handler
    const result = await handleVisualStart(imageBuffer);
    if (result.success) {
      // Send back the audio of the AI's first question and the initial history
      return NextResponse.json({
        audio: result.audioData?.toString('base64'),
        history: result.newHistory,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}