import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import chatRoutes from "./routes/chat.routes.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// ✅ CORS fix (127.0.0.1:3000 -> localhost:5001)
app.use(cors({ origin: true, methods: ["GET","POST","OPTIONS"], allowedHeaders: ["Content-Type"] }));

// ✅ health check
app.get("/health", (req,res)=> res.json({ ok:true, time: new Date().toISOString() }));

// ✅ API
app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);

// ✅ Optional: serve frontend from backend (if you want)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "..", "frontend");
app.use("/frontend", express.static(frontendPath));

const PORT = process.env.PORT || 5001;
app.listen(PORT, ()=> console.log(`✅ Backend running on http://localhost:${PORT}`));