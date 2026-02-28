import express from "express";
import { offlineReply } from "../services/offline.service.js";
import { aiReply } from "../services/ai.service.js";

const router = express.Router();

router.post("/chat", async (req,res) => {
  const message = (req.body?.message || "").toString().trim();
  if(!message) return res.status(400).json({ reply: "Message required" });

  const provider = (process.env.AI_PROVIDER || "OFFLINE").toUpperCase();

  try{
    if(provider === "GEMINI"){
      const out = await aiReply(message);
      return res.json({ reply: out.reply, mode: out.mode || "ai" });
    }

    const out = offlineReply(message);
    return res.json({ reply: out.reply, mode: out.mode || "offline" });

  }catch(e){
    const out = offlineReply(message);
    return res.json({ reply: out.reply, mode: "offline", error: "fallback" });
  }
});

export default router;