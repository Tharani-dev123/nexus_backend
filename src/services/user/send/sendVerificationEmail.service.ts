import { OtpPurpose } from "@prisma/client";
import USER_REPO from "../../../database/user/index.repo.js";
import OTP_SERVICE from "../../auth/OTP/persistentOtp.service.js";
import AWS_SERVICE from "../../aws/index.service.js";

export default async function sendVerificaitonEmail(email: string, ipAddress = "unknown") {
  if (!await OTP_SERVICE.recordOtpRequest(ipAddress, OtpPurpose.EMAIL_VERIFICATION)) return;
  const user = await USER_REPO.getUserByEmail(email);
  if (!user) return;

  if (user.isEmailVerified) {
    throw new Error("Email is already verified.");
  }

  const otp = await OTP_SERVICE.issuePersistentOtp(email, OtpPurpose.EMAIL_VERIFICATION, user.id, ipAddress);
  if (!otp) return;

  await AWS_SERVICE.EMAIL.sendEmail({
    to: [email],
    subject: "Email Verification",
    text: `Your OTP for email verification is: ${otp}`,
  });

  return;
}
