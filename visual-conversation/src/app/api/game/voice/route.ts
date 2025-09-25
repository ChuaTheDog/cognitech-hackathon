import { NextRequest, NextResponse } from 'next/server';
import { handleVisualQuery } from '@/lib/visual-ai-service'; 

export async function POST(req: NextRequest) {
  try {
    // This endpoint expects FormData with the user's audio and the conversation history
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const historyString = formData.get('history') as string | null;

    if (!audioFile || historyString === null) {
      return NextResponse.json({ error: 'Missing audio or history.' }, { status: 400 });
    }

    // Parse the history from the frontend
    const history = JSON.parse(historyString);

    // Call the query handler from our main AI service
    const result = await handleVisualQuery(audioFile, history);

    if (result.success) {
      // Send back the audio of the AI's response and the updated history
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