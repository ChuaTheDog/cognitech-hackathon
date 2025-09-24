import { transcribeAudio } from './azure-speech.service';
import { processGameTurn } from './game-logic.service';
import { synthesizeSpeech } from './elevenlabs.service';

/**
 * This is the main orchestrator function that manages a game turn.
 */
export async function handleGameTurn(
  audioBlob: Blob,
  currentItems: string[]
): Promise<{ success: boolean; audioData?: Buffer; newItems?: string[]; error?: string }> {
  try {
    // Step 1: Transcribe Audio
    const userText = await transcribeAudio(audioBlob);
    if (!userText) {
      throw new Error('Could not understand audio.');
    }

    // Step 2: Process Game Logic
    const llmResult = await processGameTurn(userText, currentItems);

    let responseText = '';
    let newItems = currentItems;

    if (llmResult.is_correct) {
        responseText = llmResult.response_text;
        newItems = llmResult.new_items;
    } else {
        responseText = `Game over! ${llmResult.error_description}`;
        newItems = []; // Reset the game
    }

    // Step 3: Synthesize Speech
    const audioData = await synthesizeSpeech(responseText);

    return { success: true, audioData, newItems };

  } catch (error: any) {
    console.error("Error in handleGameTurn:", error);
    return { success: false, error: error.message };
  }
}