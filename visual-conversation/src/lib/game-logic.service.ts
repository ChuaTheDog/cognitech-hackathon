import OpenAI from 'openai';

// --- Client Setup ---
const azureOpenAI = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-01' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
});

// --- Type Definition ---
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// --- Main Exported Function ---
export async function getVisualConversationResponse(
  imageDescription: string,
  userQuery: string,
  history: ChatMessage[]
): Promise<string> {
  const systemPrompt = `Role: You are a friendly and supportive speech therapist...`; // Your full Speech Therapist prompt here

  // We build the message list for the LLM
  let messages: ChatMessage[] = [...history];

  if (history.length === 0) {
    // First turn: provide image description as context along with the user's first query
    messages.push({ role: 'user', content: `Context: The user is looking at a picture described as: "${imageDescription}". The user's first question is: "${userQuery}"` });
  } else {
    // Subsequent turns: just add the new user query
    messages.push({ role: 'user', content: userQuery });
  }

  const response = await azureOpenAI.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
  });

  return response.choices[0].message.content || "I'm not sure what to say.";
}