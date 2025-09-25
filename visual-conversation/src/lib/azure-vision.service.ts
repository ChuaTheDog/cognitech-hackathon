import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

// --- Client Setup ---
const key = process.env.AZURE_OPENAI_KEY!; // Using the same multi-purpose key
const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;

const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } });
const visionClient = new ComputerVisionClient(credentials, endpoint);

// --- Main Exported Function ---
export async function getImageDescription(imageBuffer: Buffer): Promise<string> {
  try {
    const analysis = await visionClient.describeImageInStream(imageBuffer, {
      language: 'en',
      maxCandidates: 1,
    });

    if (analysis.captions && analysis.captions.length > 0 && analysis.captions[0].text) {
      return analysis.captions[0].text;
    } else {
      return "I can see an image, but I can't describe it.";
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image with Azure Vision service.");
  }
}