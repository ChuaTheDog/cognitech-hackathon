import OpenAI from 'openai';

const azureOpenAI = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-01' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
});

export async function processGameTurn(userText: string, currentItems: string[]): Promise<any> {
  const systemPrompt = `
    You are the host of the game "I'm packing my suitcase". You are friendly and encouraging, but you must follow the game rules.
    
    IMPORTANT: Be flexible with speech recognition errors. The user's text may contain:
    - Misheard words due to accents or pronunciation
    - Partial words or phonetic spellings
    - Common speech-to-text errors
    
    Use fuzzy matching and context clues to understand what the player meant. If you're unsure about an item, make your best guess based on context.
    
    BLACKLIST: Never use the word "hat" as an item.
    
    Your response must be a single, valid JSON object and nothing else. Do not include any text before or after the JSON.
    `;

  const itemsStr = currentItems.join(', ');
  const userPrompt = `You are an AI game master for the "I'm packing my suitcase" game. Your task is to validate the player's turn and take your own turn.
    GAME STATE
    - The current list of items in the suitcase is: ${itemsStr}
    - The player's spoken phrase is: ${userText}
    INSTRUCTIONS
    Follow these steps precisely:
    Step 1: Analyze the Player's Phrase
    1. The expected sequence of items the player should have said is contained in the list from the GAME STATE.
    2. Extract the list of items from the player's phrase.
    3. Compare the player's sequence to the expected sequence item by item. Use fuzzy matching for this comparison and be flexible with minor spelling or pronunciation errors (e.g., "shert" for "shirt", "tooth brush" for "toothbrush"). A turn is correct if the player correctly lists at least 80% of the expected items in the correct order.
    4. Identify the single new item the player added at the end of their sequence.
    5. If the player's new item is "hat", silently replace it with "cap". Use "cap" as their new item for the next steps. Do not tell the player about the replacement.
    Step 2: Determine the Outcome
    - If the comparison is successful (is_correct: true):
        1. Create a new list by adding the player's new item (or its replacement) to the end of the expected sequence.
        2. Now, take your turn: add ONE new, creative, and logical item to the end of this list. This becomes the final "new_items" list.
        3. Construct the "response_text". It MUST start with the exact phrase "I'm packing my suitcase and in it I have..." followed by all the items from the final "new_items" list, separated by commas.
        4. Set "error_description" to null.
    - If the comparison fails (is_correct: false):
        1. Do NOT add any new items. The "new_items" list should be the original list from the GAME STATE.
        2. Create a helpful "error_description" explaining what went wrong (e.g., "You missed an item" or "The order was incorrect. The item after 'shirt' should have been 'socks'.").
        3. The "response_text" should be a friendly message encouraging the player to try again.
    Step 3: Format the Output
    Return ONLY a single JSON object with the following structure. Do not add any text or explanations outside of the JSON object.
    {
      "is_correct": boolean,
      "new_items": ["item1", "item2", ...],
      "response_text": "Your complete response string",
      "error_description": "A description of the error if incorrect, otherwise null"
    }`;
  const response = await azureOpenAI.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
      ]
  });

  const rawResponse = response?.choices[0]?.message?.content!;

  // This handles cases where the LLM wraps the JSON in Markdown code blocks.
  try {
    const jsonStartIndex = rawResponse.indexOf('{');
    const jsonEndIndex = rawResponse.lastIndexOf('}');
    
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("No JSON object found in the LLM response.");
    }

    const jsonString = rawResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    const parsedResponse = JSON.parse(jsonString);
    
    // Validate the response structure
    if (!parsedResponse.hasOwnProperty('is_correct') || 
        !parsedResponse.hasOwnProperty('new_items') || 
        !parsedResponse.hasOwnProperty('response_text')) {
      throw new Error("Invalid response structure from LLM.");
    }
    
    return parsedResponse;
  } catch (error) {
    console.error("Failed to parse JSON from LLM response:", rawResponse);
    console.error("Error details:", error);
    
    // Return a fallback response to prevent the game from breaking
    return {
      is_correct: false,
      new_items: currentItems, // Keep current items for retry
      response_text: "I'm sorry, I had trouble understanding your response. Please try speaking more clearly and slowly. Let's try again!",
      error_description: "Technical error in processing your response."
    };
  }
}