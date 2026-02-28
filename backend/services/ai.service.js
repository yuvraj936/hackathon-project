import { GoogleGenerativeAI } from "@google/generative-ai";

export async function aiReply(message){
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `
You are Jarvis Medical AI for a hackathon demo.
Rules:
- Be safe, not a doctor.
- Give short, clear guidance.
- Add "Consult a doctor" when needed.
User: ${message}
`;

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() || "";
  return { mode:"ai", reply: text, source:"gemini" };
}