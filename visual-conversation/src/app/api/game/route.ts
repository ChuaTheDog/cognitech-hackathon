import { NextRequest, NextResponse } from 'next/server';
import { handleGameTurn } from '@/lib/ai-game-service'; 

export async function POST(req: NextRequest) {
  try {
    const audioBlob = await req.blob();

    const result = await handleGameTurn(audioBlob, []);

    if (result.success && result.audioData) {
      return new NextResponse(Buffer.from(result.audioData), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
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