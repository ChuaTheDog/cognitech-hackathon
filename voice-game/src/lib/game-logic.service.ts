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
  const isFirstTurn = currentItems.length === 0;

  const userPrompt = isFirstTurn
    ? `This is the first turn. The player said: "${userText}".
       
       TASK: Extract the item the player is packing. Be flexible with speech recognition errors:
       - Look for common item words even if misspelled
       - Consider phonetic similarities (e.g., "shirt" might be heard as "shert")
       - If unclear, make your best guess based on context
       - Common items include: clothes, toiletries, electronics, books, etc.
       
       BLACKLIST: If the player says "hat", replace it with a different item like "cap", "beanie", or "headband".
       
       Then invent and add your own next item that's different from the player's item.
       Formulate the response according to the template "I'm packing my suitcase and in it I have [player's item] and [your item]".
       
       Return a JSON object in the format:
       {"is_correct": true, "new_items": ["player item", "your item"], "response_text": "your formulated response"}
      `
    : `The current list of items is: [${itemsStr}].
       The player's phrase is: "${userText}".
       
       TASK: Check if the player correctly repeated all items in order and added one new item.
       
       BE FLEXIBLE with speech recognition errors:
       - Items may be pronounced differently due to accents
       - Words may be misspelled or partially heard
       - Use fuzzy matching - if an item sounds similar to the expected item, accept it
       - Focus on the overall pattern rather than exact word matches
       - If 80% of the items are recognizable and in the right order, consider it correct
       
       Examples of acceptable variations:
       - "shirt" could be heard as "shert", "shurt", "shirt"
       - "toothbrush" could be heard as "tooth brush", "toothbrush", "toothbrash"
       - "socks" could be heard as "socks", "sock", "sax"
       
       BLACKLIST: If the player says "hat", replace it with a different item like "cap", "beanie", or "headband".
       
       If the player got most items right and added a new item, mark as correct.
       Only mark as incorrect if the player clearly missed multiple items or got the order very wrong.
       
       If correct, add the new item to the list and invent your own next item.
       If incorrect, provide a helpful error message explaining what went wrong.
       
       Return a JSON object in the format:
       {"is_correct": true/false, "new_items": ["updated list"], "response_text": "your response", "error_description": "error if incorrect"}
      `;
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