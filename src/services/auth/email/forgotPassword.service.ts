import forgotPasswordCache from "../../../config/cache/forgotPassword.cache.js";
import AWS_SERVICE from "../../aws/index.service.js";
import USER_SERVICE from "../../user/index.service.js";
import AUTH_SERVICE from "../index.service.js";

export default async function forgotPasswordService(email: string) {
  const user = await USER_SERVICE.getUserByEmail(email);

  const otp = AUTH_SERVICE.OTP.generateOtp();

  forgotPasswordCache.set(user.id, otp);

  AWS_SERVICE.EMAIL.sendEmail({
    to: [email],
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}`,
  });

  return;
}
