import { NextResponse } from 'next/server';
import { synthesizeSpeech } from '@/lib/elevenlabs.service';
import fs from 'fs';
import path from 'path';

const WELCOME_MESSAGE = `
Hello! Let's play "I'm packing my suitcase". 
I'll start by saying an item, then you repeat my item and add your own. 
For example, if I say: "I'm packing my suitcase and in it I have a shirt", 
you would say: "I'm packing my suitcase and in it I have a shirt and..." then add your own item.
Ready? You can start by saying what you are packing first.
`;

const STATIC_AUDIO_PATH = path.join(process.cwd(), 'public', 'welcome-audio.mp3');

export async function POST() {
  try {
    let audioData: Buffer;
    let audioPath = '/welcome-audio.mp3';
    // Check if the static audio file already exists
    if (fs.existsSync(STATIC_AUDIO_PATH)) {
      audioData = fs.readFileSync(STATIC_AUDIO_PATH);
    } else {
      // Generate audio from the welcome message
      audioData = await synthesizeSpeech(WELCOME_MESSAGE);
      // Ensure the public directory exists
      const publicDir = path.dirname(STATIC_AUDIO_PATH);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      // Save the audio data to a static file
      fs.writeFileSync(STATIC_AUDIO_PATH, audioData);
    }
    return NextResponse.json({
      success: true,
      audioPath: audioPath,
      message: 'Welcome audio ready'
    });

  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Could not start the game.' 
      },
      { status: 500 }
    );
  }
}