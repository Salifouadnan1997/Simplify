import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const interaction = await ai.interactions.create({
      model: 'gemini-3.1-flash-lite-image',
      input: "A robot holding a red skateboard.",
      response_modalities: ['image'],
      generation_config: {
        image_config: {
          aspect_ratio: "16:9",
          image_size: "1K"
        },
      },
    });
    for (const step of interaction.steps) {
      if (step.type === 'model_output') {
        const imageContent = step.content?.find(c => c.type === 'image');
        if (imageContent && imageContent.data) {
          console.log("Success! Generated image.");
        }
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
