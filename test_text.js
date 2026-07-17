import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: "Hello, write a single word greeting."
    });
    console.log("Success with gemini-3.1-flash-lite! Response:", response.text);
  } catch (err) {
    console.error("Error with gemini-3.1-flash-lite:", err.message);
  }
}
run();
