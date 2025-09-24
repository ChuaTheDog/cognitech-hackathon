import { ElevenLabsClient } from 'elevenlabs';

// --- Client Setup ---
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// --- Main Exported Function ---
export async function synthesizeSpeech(text: string): Promise<Buffer> {
    const audioStream = await elevenlabs.generate({
        voice: "Rachel",
        text: text,
        model_id: "eleven_multilingual_v2"
    });

    // Convert the audio stream to a buffer
    const chunks = [];
    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}