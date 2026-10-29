import { OtpPurpose } from "@prisma/client";
import USER_REPO from "../../../database/user/index.repo.js";
import USER_SERVICE from "../index.service.js";
import OTP_SERVICE from "../../auth/OTP/persistentOtp.service.js";
import { AppError } from "../../../types/AppError.js";

export default async function verifyEmailService(email: string, otp: string, ipAddress = "unknown") {
  if (!await OTP_SERVICE.recordOtpVerificationAttempt(ipAddress, OtpPurpose.EMAIL_VERIFICATION)) throw new AppError("Invalid or expired verification code", 401);
  const user = await USER_SERVICE.getUserByEmail(email);

  if (user.isEmailVerified) {
    throw new Error("Email is already verified.");
  }

  if (!await OTP_SERVICE.consumePersistentOtp(email, OtpPurpose.EMAIL_VERIFICATION, otp, user.id, ipAddress)) {
    throw new AppError("Invalid or expired verification code", 401);
  }
  const updatedUser = await USER_REPO.verifyEmail(user);

  return updatedUser;
}
