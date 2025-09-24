// ... all the imports
import { transcribeAudio } from './azure-speech.service';
import { getImageDescription } from './azure-vision.service';
import { getVisualConversationResponse, ChatMessage } from './game-logic.service';
import { synthesizeSpeech } from './elevenlabs.service';

/**
 * Handles the very first step: gets an image and generates the opening question.
 */
export async function handleVisualStart(
  imageBuffer: Buffer
): Promise<{ success: boolean; audioData?: Buffer; newHistory?: ChatMessage[]; error?: string }> {
  try {
    // Step 1: Get image description
    const imageDescription = await getImageDescription(imageBuffer);

    // Step 2: Call LLM with an empty user query to get the opening question
    const openingQuestion = await getVisualConversationResponse(imageDescription, "", []);

    // Step 3: Synthesize the opening question
    const audioData = await synthesizeSpeech(openingQuestion);

    // The new history starts with the AI's first question
    const newHistory: ChatMessage[] = [
      { role: 'assistant', content: openingQuestion }
    ];

    return { success: true, audioData, newHistory };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Handles a subsequent turn in the conversation.
 */
export async function handleVisualQuery(
  audioBlob: Blob,
  history: ChatMessage[],
  // We no longer need the image buffer here, only the history
): Promise<{ success: boolean; audioData?: Buffer; newHistory?: ChatMessage[]; error?: string }> {
  try {
    // Step 1: Transcribe user's answer
    const userQuery = await transcribeAudio(audioBlob);

    // Step 2: Get LLM's follow-up response
    // The image description is now baked into the history from the first turn
    const llmResponseText = await getVisualConversationResponse("", userQuery, history);
    
    // Step 3: Synthesize the response
    const audioData = await synthesizeSpeech(llmResponseText);

    // Update history
    const newHistory: ChatMessage[] = [
      ...history,
      { role: 'user', content: userQuery },
      { role: 'assistant', content: llmResponseText }
    ];

    return { success: true, audioData, newHistory };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}