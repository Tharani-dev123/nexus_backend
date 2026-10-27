import otpLoginCache from "../../../config/cache/otpLogin.cache.js";
import USER_REPO from "../../../database/user/index.repo.js";
import AWS_SERVICE from "../../aws/index.service.js";
import { AppError } from "../../../types/AppError.js";
import AUTH_SERVICE from "../index.service.js";

/**
 * Emails a one-time login code to a passwordless user account. Accounts that have a password must use the
 * normal password login, so we reject those here.
 */
export default async function requestLoginOtp(email: string) {
  const user = await USER_REPO.getUserWithCredentialByEmail(email);

  if (!user) {
    throw new AppError("No login is enabled for this email", 404);
  }
  if (user.credential) {
    throw new AppError("This account logs in with a password", 400);
  }

  const otp = AUTH_SERVICE.OTP.generateOtp();
  otpLoginCache.set(user.id, otp);

  await AWS_SERVICE.EMAIL.sendEmail({
    to: [email],
    subject: "Your one-time login code",
    text: `Your one-time login code is: ${otp}\n\nIt expires in 10 minutes. If you didn't try to sign in, you can ignore this email.`,
  });

  return;
}
