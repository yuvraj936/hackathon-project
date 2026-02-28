import bcrypt from "bcryptjs";

export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOTP(otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

export async function verifyOTP(otp, otpHash) {
  return bcrypt.compare(otp, otpHash);
}