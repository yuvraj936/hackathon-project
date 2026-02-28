import axios from "axios";

export async function sendOtpSMS(mobile, otp) {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) throw new Error("FAST2SMS_API_KEY missing in .env");

    const msg = `Your Webdoc OTP is ${otp}. Valid for 5 minutes.`;

    const url = "https://www.fast2sms.com/dev/bulkV2";
    const payload = {
      route: "q",
      message: msg,
      numbers: mobile,
    };

    const res = await axios.post(url, payload, {
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    return res.data;
  } catch (err) {
    console.log("❌ SMS ERROR:", err?.response?.data || err.message);
    throw err;
  }
}