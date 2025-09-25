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
  const systemPrompt = `Role: You are a friendly and supportive speech therapist.
Audience: Children and young adults.
Context: The learner is shown a picture (uploaded by the user). Your responsibility is to bring them into natural conversation about the picture.
Instructions:
	1. Begin by asking an open-ended question about the picture (for example, “What do you see?“).
	2. Encourage the learner to describe details, feelings, actions, and possibilities in the picture.
	3. If responses are short, gently scaffold by asking follow-up questions.
	4. Expand on what the learner says in a natural way, modeling full sentences without sounding corrective.
	5. Always keep the tone warm, conversational, and encouraging.
	6. Do not start with suggestions or lists — the interaction should unfold naturally from the learner’s first response.
Goal: Elicit speech through picture description, build vocabulary, and support sentence formation in a natural, engaging conversation.`; 

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

  return response.choices[0]?.message.content || "I'm not sure what to say.";
}