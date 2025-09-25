import { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';

const speechConfig = SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY!, process.env.AZURE_SPEECH_REGION!);
speechConfig.speechRecognitionLanguage = 'en-US';
speechConfig.setProperty('SpeechServiceConnection_InitialSilenceTimeoutMs', '2000');
speechConfig.setProperty('SpeechServiceConnection_EndSilenceTimeoutMs', '500');

async function convertAudioToWav(inputBlob: Blob): Promise<string> {
  const format = inputBlob.type.split('/')[1] || 'webm';
  const inputPath = path.join(os.tmpdir(), `input-${Date.now()}.${format}`);
  const outputPath = path.join(os.tmpdir(), `output-${Date.now()}.wav`);
  
  const buffer = Buffer.from(await inputBlob.arrayBuffer());
  fs.writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioCodec('pcm_s16le')
      .audioFrequency(8000)
      .audioChannels(1)
      .audioBitrate('32k')
      .audioFilters([
        'volume=1.2'
      ])
      .outputOptions([
        '-threads', '0',
        '-preset', 'ultrafast'
      ])
      .on('end', () => {
        fs.unlinkSync(inputPath);
        resolve(outputPath)
      })
      .on('error', (err) => {
        fs.unlinkSync(inputPath);
        reject(err)
      })
      .save(outputPath);
  });
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const wavPath = await convertAudioToWav(audioBlob);
  const audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(wavPath));
  const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        fs.unlinkSync(wavPath);
        
        if (result.reason === ResultReason.RecognizedSpeech) {
          const cleanedText = result.text.trim().toLowerCase();
          if (cleanedText.length === 0) {
            reject(new Error('No speech detected. Please try speaking more clearly.'));
          } else {
            resolve(cleanedText);
          }
        } else if (result.reason === ResultReason.NoMatch) {
          reject(new Error('I couldn\'t understand what you said. Please try speaking more clearly and slowly.'));
        } else if (result.reason === ResultReason.Canceled) {
          const cancellation = result.errorDetails;
          if (cancellation.includes('TooManyRequests')) {
            reject(new Error('Service is busy. Please try again in a moment.'));
          } else {
            reject(new Error('Speech recognition was canceled. Please try again.'));
          }
        } else {
          reject(new Error(result.errorDetails || 'Speech could not be recognized. Please try again.'));
        }
      },
      (err) => {
        recognizer.close();
        fs.unlinkSync(wavPath);
        reject(new Error(`Speech recognition error: ${err || 'Unknown error'}`));
      }
    );
  });
}