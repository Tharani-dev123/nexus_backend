import emailVerificationCache from "../../../config/cache/emailVerification.cache.js";
import AUTH_SERVICE from "../../auth/index.service.js";
import AWS_SERVICE from "../../aws/index.service.js";
import USER_SERVICE from "../index.service.js";

export default async function sendVerificaitonEmail(email: string) {
  const user = await USER_SERVICE.getUserByEmail(email);

  if (user.isEmailVerified) {
    throw new Error("Email is already verified.");
  }

  const otp = AUTH_SERVICE.OTP.generateOtp();

  emailVerificationCache.set(user.id, otp);

  await AWS_SERVICE.EMAIL.sendEmail({
    to: [email],
    subject: "Email Verification",
    text: `Your OTP for email verification is: ${otp}`,
  });

  return;
}
