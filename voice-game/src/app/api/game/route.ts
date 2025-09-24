import { NextRequest, NextResponse } from 'next/server';
import { handleGameTurn } from '@/lib/ai-game-service'; 

export async function POST(req: NextRequest) {
  try {
    // Get audio data from the request
    const audioBlob = await req.blob();

    // Call your main AI function, passing it the audio
    const result = await handleGameTurn(audioBlob);

    if (result.success) {
      // Send the audio response back to the frontend
      return new NextResponse(result.audioData, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    } else {
      // Return an error if something went wrong
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