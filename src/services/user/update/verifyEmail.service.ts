import emailVerificationCache from "../../../config/cache/emailVerification.cache.js";
import USER_REPO from "../../../database/user/index.repo.js";
import USER_SERVICE from "../index.service.js";

export default async function verifyEmailService(email: string, otp: string) {
  const user = await USER_SERVICE.getUserByEmail(email);

  if (user.isEmailVerified) {
    throw new Error("Email is already verified.");
  }

  emailVerificationCache.validate(user.id, otp);
  const updatedUser = await USER_REPO.verifyEmail(user);

  return updatedUser;
}
