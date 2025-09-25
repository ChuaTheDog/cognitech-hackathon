import { ElevenLabsClient } from 'elevenlabs';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function synthesizeSpeech(text: string): Promise<Buffer> {
    const audioStream = await elevenlabs.generate({
        voice: "Rachel",
        text: text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
            stability: 0.1,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: false
        }
    });

    const chunks = [];
    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }
    const audioData = Buffer.concat(chunks);
    return audioData;
}