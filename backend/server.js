import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import chatRoutes from "./routes/chat.routes.js";
import authRoutes from "./routes/auth.routes.js";
import mysql from "mysql2";


dotenv.config();

const app = express();
app.use(express.json());

// 🔵 Database Connection YAHAN paste karo
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Database connected successfully");
    connection.release();
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// ✅ CORS fix (127.0.0.1:3000 -> localhost:5001)
app.use(cors({ origin: true, methods: ["GET","POST","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));

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