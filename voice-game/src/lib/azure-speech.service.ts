// src/lib/azure-speech.service.ts

// highlight-next-line
import { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';

// --- Client Setup ---
const speechConfig = SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY!, process.env.AZURE_SPEECH_REGION!);
speechConfig.speechRecognitionLanguage = 'en-US';

/**
 * Converts any audio format supported by ffmpeg to a WAV file.
 * @param inputBlob The audio data received.
 * @returns The file path to the converted WAV audio.
 */
async function convertAudioToWav(inputBlob: Blob): Promise<string> {
  const format = inputBlob.type.split('/')[1] || 'webm';
  const inputPath = path.join(os.tmpdir(), `input-${Date.now()}.${format}`);
  const outputPath = path.join(os.tmpdir(), `output-${Date.now()}.wav`);
  
  const buffer = Buffer.from(await inputBlob.arrayBuffer());
  fs.writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioCodec('pcm_s16le').audioFrequency(16000).audioChannels(1)
      .on('end', () => {
        fs.unlinkSync(inputPath); // Clean up temp input file
        resolve(outputPath)
      })
      .on('error', (err) => {
        fs.unlinkSync(inputPath); // Clean up temp input file
        reject(err)
      })
      .save(outputPath);
  });
}

/**
 * The main exported function that transcribes audio.
 * @param audioBlob The audio blob from the request.
 * @returns The transcribed text as a string.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const wavPath = await convertAudioToWav(audioBlob);
  const audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(wavPath));
  const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        fs.unlinkSync(wavPath); // Clean up the temp wav file
        if (result.reason === ResultReason.RecognizedSpeech) {
          resolve(result.text);
        } else {
          reject(new Error(result.errorDetails || 'Speech could not be recognized.'));
        }
      },
      (err) => {
        recognizer.close();
        fs.unlinkSync(wavPath); // Clean up the temp wav file
        reject(err);
      }
    );
  });
}