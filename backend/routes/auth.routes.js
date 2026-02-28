import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { generateOTP, hashOTP, verifyOTP } from "../utils/otp.js";
import { sendOtpEmail } from "../services/email.service.js";
import { sendOtpSMS } from "../services/sms.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/auth/signup
 * body: { fullName, email, mobile }
 */
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, mobile } = req.body;

    if (!fullName || !email || !mobile) {
      return res.status(400).json({ ok: false, message: "Full name, email, mobile required" });
    }

    const [exist] = await pool.query(
      "SELECT id FROM users WHERE email=? OR mobile=? LIMIT 1",
      [email, mobile]
    );

    if (exist.length) {
      return res.status(409).json({ ok: false, message: "User already exists" });
    }

    const [ins] = await pool.query(
      "INSERT INTO users (full_name, email, mobile) VALUES (?, ?, ?)",
      [fullName, email, mobile]
    );

    return res.json({ ok: true, message: "Account created", userId: ins.insertId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/**
 * POST /api/auth/request-otp
 * body: { mobile } OR { email }
 */
router.post("/request-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ ok: false, message: "Mobile required" });
    }

    // ✅ Step 1: DB me mobile se email find karo
    const [u] = await pool.query(
      "SELECT email FROM users WHERE mobile=? LIMIT 1",
      [mobile]
    );

    if (!u.length || !u[0].email) {
      return res.status(404).json({
        ok: false,
        message: "No registered email found. Please signup first.",
      });
    }

    const email = u[0].email;

    // ✅ Step 2: OTP generate karo
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ✅ Step 3: OTP DB me store karo
    await pool.query(
      "INSERT INTO otps (mobile, email, otp_hash, expires_at) VALUES (?, ?, ?, ?)",
      [mobile, email, otpHash, expiresAt]
    );

    // ✅ Step 4: OTP usi registered email pe bhejo
    await sendOtpEmail(email, otp);

    return res.json({
      ok: true,
      message: "OTP sent to your registered email ✅",
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/**
 * POST /api/auth/verify-otp
 * body: { mobile, otp } OR { email, otp }
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, email, otp } = req.body;

    if ((!mobile && !email) || !otp) {
      return res.status(400).json({ ok: false, message: "Mobile/Email and OTP required" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM otps
       WHERE used=0 AND expires_at > NOW()
       AND mobile = ?
       ORDER BY id DESC LIMIT 1`,
      [mobile || null, email || null]
    );

    if (!rows.length) {
      return res.status(400).json({ ok: false, message: "OTP expired or not found" });
    }

    const rec = rows[0];
    const ok = await verifyOTP(otp, rec.otp_hash);

    if (!ok) {
      return res.status(400).json({ ok: false, message: "Invalid OTP" });
    }

    await pool.query("UPDATE otps SET used=1 WHERE id=?", [rec.id]);

    // ensure user exists for login (optional)
    const [u] = await pool.query(
      "SELECT id FROM users WHERE mobile=? OR email=? LIMIT 1",
      [mobile || null, email || null]
    );

    let userId;
    if (u.length) {
      userId = u[0].id;
    } else {
      // create minimal user if login without signup
      const [ins] = await pool.query(
        "INSERT INTO users (full_name, mobile, email) VALUES (?, ?, ?)",
        ["User", mobile || null, email || null]
      );
      userId = ins.insertId;
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({ ok: true, message: "Login successful", token, userId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, mobile, created_at FROM users WHERE id=? LIMIT 1",
      [req.userId]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    return res.json({ ok: true, user: rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;