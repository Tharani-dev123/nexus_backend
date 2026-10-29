import { OtpPurpose } from "@prisma/client";
import prisma from "../../../database/index.db.js";
import USER_REPO from "../../../database/user/index.repo.js";
import { AppError } from "../../../types/AppError.js";
import AUTH_SERVICE from "../index.service.js";
import OTP_SERVICE from "../OTP/persistentOtp.service.js";

export default async function resetPasswordService(
  email: string,
  otp: string,
  newPassword: string,
  ipAddress = "unknown",
) {
  if (!await OTP_SERVICE.recordOtpVerificationAttempt(ipAddress, OtpPurpose.PASSWORD_RESET)) throw new AppError("Invalid or expired OTP", 401);
  const user = await USER_REPO.getUserWithCredentialByEmail(email);
  if (!user?.credential) throw new AppError("Invalid or expired OTP", 401);
  if (user.userRole === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { status: true } });
    if (profile?.status !== "ACTIVE") {
      await OTP_SERVICE.invalidateOtp(email, OtpPurpose.PASSWORD_RESET);
      throw new AppError("Invalid or expired OTP", 401);
    }
  }
  if (!await OTP_SERVICE.consumePersistentOtp(email, OtpPurpose.PASSWORD_RESET, otp, user.id, ipAddress)) {
    throw new AppError("Invalid or expired OTP", 401);
  }
  const hashPassword = await AUTH_SERVICE.PASSWORD.hashPassword(newPassword);
  const updatedUser = await prisma.$transaction(async (tx) => {
    const updatedCredential = await tx.credential.update({ where: { userId: user.id }, data: { passwordHash: hashPassword } });
    await tx.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
    return updatedCredential;
  });

  return updatedUser;
}
