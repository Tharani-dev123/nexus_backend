import { OtpPurpose } from "@prisma/client";
import prisma from "../../../database/index.db.js";
import USER_REPO from "../../../database/user/index.repo.js";
import AWS_SERVICE from "../../aws/index.service.js";
import OTP_SERVICE from "../OTP/persistentOtp.service.js";

export default async function forgotPasswordService(email: string, ipAddress = "unknown") {
  if (!await OTP_SERVICE.recordOtpRequest(ipAddress, OtpPurpose.PASSWORD_RESET)) return;
  const user = await USER_REPO.getUserWithCredentialByEmail(email);
  if (!user?.credential || user.mustChangePassword) return;
  if (user.userRole === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { status: true } });
    if (profile?.status !== "ACTIVE") return;
  }
  const otp = await OTP_SERVICE.issuePersistentOtp(email, OtpPurpose.PASSWORD_RESET, user.id, ipAddress);
  if (!otp) return;

  await AWS_SERVICE.EMAIL.sendEmail({
    to: [email],
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}`,
  });

  return;
}
