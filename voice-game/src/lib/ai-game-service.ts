import { transcribeAudio } from './azure-speech.service';
import { processGameTurn } from './game-logic.service';
import { synthesizeSpeech } from './elevenlabs.service';
import { createTimingService } from './timing.service';


export async function handleGameTurn(
  audioBlob: Blob,
  currentItems: string[]
): Promise<{ success: boolean; audioData?: Buffer; newItems?: string[]; error?: string }> {
  const timer = createTimingService('game turn processing');
  
  try {
    // Step 1: Transcribe Audio
    timer.startStep('audio transcription');
    const userText = await transcribeAudio(audioBlob);
    timer.endStep();
    
    if (!userText) {
      throw new Error('I couldn\'t understand what you said. Please try speaking more clearly and slowly.');
    }
    
    timer.logStepInfo(`Transcribed text: "${userText}"`);

    // Step 2: Process Game Logic
    timer.startStep('game logic processing');
    const llmResult = await processGameTurn(userText, currentItems);
    timer.endStep();
    
    let responseText = '';
    let newItems = currentItems;
    if (llmResult.is_correct) {
        responseText = llmResult.response_text;
        newItems = llmResult.new_items;
        timer.logStepInfo(`Game turn successful! New items: [${newItems.join(', ')}]`);
    } else {
        // Check if it's a technical error vs game over
        if (llmResult.error_description && llmResult.error_description.includes("Technical error")) {
            responseText = "I had trouble understanding that. Let's try again! Please speak clearly and repeat the items in order.";
            newItems = currentItems; // Keep current items for retry
            timer.logStepInfo('Technical error - keeping current items for retry');
        } else {
            responseText = `Game over! ${llmResult.error_description}`;
            newItems = []; // Reset the game
            timer.logStepInfo(`Game over: ${llmResult.error_description}`);
        }
    }

    // Step 3: Synthesize Speech
    timer.startStep('speech synthesis');
    const audioData = await synthesizeSpeech(responseText);
    timer.endStep();

    timer.logStepInfo(`Response text: "${responseText}"`);
    timer.complete();

    return { success: true, audioData, newItems };

  } catch (error: any) {
    timer.completeWithError(error);
    return { success: false, error: error.message };
  }
}