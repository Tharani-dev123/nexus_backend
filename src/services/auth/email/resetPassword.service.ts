import forgotPasswordCache from "../../../config/cache/forgotPassword.cache.js";
import USER_SERVICE from "../../user/index.service.js";
import AUTH_SERVICE from "../index.service.js";
import AUTH_REPO from "../../../database/auth/index.repo.js";

export default async function resetPasswordService(
  email: string,
  otp: string,
  newPassword: string,
) {
  const user = await USER_SERVICE.getUserByEmail(email);

  if (!forgotPasswordCache.validate(user.id, otp)) {
    throw new Error("Invalid or expired OTP");
  }

  forgotPasswordCache.delete(user.id);

  const hashPassword = await AUTH_SERVICE.PASSWORD.hashPassword(newPassword);
  const updatedUser = await AUTH_REPO.PASSWORD.update(user, hashPassword);

  return updatedUser;
}
