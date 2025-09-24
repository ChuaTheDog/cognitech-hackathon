import { NextRequest, NextResponse } from 'next/server';
import { handleGameTurn } from '@/lib/ai-game-service'; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const currentItemsStr = formData.get('currentItems') as string;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
    const currentItems = currentItemsStr ? JSON.parse(currentItemsStr) : [];

    const result = await handleGameTurn(audioBlob, currentItems);

    if (result.success && result.audioData) {
      return new NextResponse(JSON.stringify({
        audioData: Buffer.from(result.audioData).toString('base64'),
        newItems: result.newItems || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}