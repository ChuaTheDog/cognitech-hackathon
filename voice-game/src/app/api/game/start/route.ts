import { NextResponse } from 'next/server';
// highlight-next-line
import { synthesizeSpeech } from '@/lib/elevenlabs.service'; // We only need the TTS service here

// The text that explains the rules of the game
const WELCOME_MESSAGE = `
Hello! Let's play "I'm packing my suitcase". 
I'll start by saying an item, then you repeat my item and add your own. 
For example, if I say: "I'm packing my suitcase and in it I have a shirt", 
you would say: "I'm packing my suitcase and in it I have a shirt and..." then add your own item.
Ready? You can start by saying what you are packing first.
`;

export async function POST() {
  try {
    // Step 1: Generate the welcome audio from the predefined text
    const audioData = await synthesizeSpeech(WELCOME_MESSAGE);

    // Step 2: Send the audio response back to the frontend
    return new NextResponse(audioData, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });

  } catch (error) {
    console.error("Error starting game:", error);
    // Return a generic error for unexpected issues
    return NextResponse.json(
      { error: 'Could not start the game.' },
      { status: 500 }
    );
  }
}