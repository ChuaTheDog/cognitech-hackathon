import OpenAI from 'openai';

// --- Client Setup ---
const azureOpenAI = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-01' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
});

// --- Main Exported Function ---
export async function processGameTurn(userText: string, currentItems: string[]): Promise<any> {
  const systemPrompt = `
    You are the host of the game "I'm packing my suitcase". You must be strict with the rules.
    Your response must be a single, valid JSON object and nothing else. Do not include any text before or after the JSON.
    `;

  const itemsStr = currentItems.join(', ');
  const isFirstTurn = currentItems.length === 0;

  const userPrompt = isFirstTurn
    ? `This is the first turn. The player said: "${userText}".
       Extract the item the player is packing. Invent and add your own next item.
       Formulate the response according to the template "I'm packing my suitcase and in it I have [player's item] and [your item]".
       
       Return a JSON object in the format:
       {"is_correct": true, "new_items": ["player item", "your item"], "response_text": "your formulated response"}
      `
    : `The current list of items is: [${itemsStr}].
       The player must repeat this list in the correct order and add one new item.
       The player's phrase is: "${userText}".
       // ... (rest of the prompt is the same)
      `;

  const response = await azureOpenAI.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
      ]
  });

  const rawResponse = response.choices[0].message.content!;

  // This handles cases where the LLM wraps the JSON in Markdown code blocks.
  try {
    const jsonStartIndex = rawResponse.indexOf('{');
    const jsonEndIndex = rawResponse.lastIndexOf('}');
    
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("No JSON object found in the LLM response.");
    }

    const jsonString = rawResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse JSON from LLM response:", rawResponse);
    throw error; 
  }
}