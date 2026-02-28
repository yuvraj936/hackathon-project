import { aiReply } from "./ai.service.js";
import { offlineReply } from "./offline.service.js";

export async function hybridReply(message){
  // If no key -> offline only
  if(!process.env.GEMINI_API_KEY) return offlineReply(message);

  // Decide: simple/common queries -> offline first
  const simple = message.length < 30;
  if(simple) return offlineReply(message);

  // Try AI, fallback to offline
  try{
    const ai = await aiReply(message);
    if(!ai.reply || ai.reply.length < 5) throw new Error("Empty AI");
    return ai;
  }catch(e){
    return offlineReply(message);
  }
}