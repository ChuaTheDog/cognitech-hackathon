// _test-visual-start.ts
// highlight-next-line
import { handleVisualStart } from './src/lib/ai-game-service'; // The filename is updated here
import fs from 'fs';
import path from 'path';

async function runStartTest() {
  console.log("--- Testing Visual Conversation Start ---");
  const imagePath = path.join(process.cwd(), 'test-image.png');
  
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Test image not found at: ${imagePath}`);
    return;
  }
  
  const imageBuffer = fs.readFileSync(imagePath);

  const result = await handleVisualStart(imageBuffer);

  if (result.success && result.audioData) {
    fs.writeFileSync('start-question.mp3', result.audioData);
    console.log("✅ Success! AI's opening question saved to start-question.mp3");
    console.log("History:", result.newHistory);
  } else {
    console.error("❌ Test Failed:", result.error);
  }
}

runStartTest();