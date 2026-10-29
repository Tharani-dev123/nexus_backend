import { OtpPurpose } from "@prisma/client";
import USER_REPO from "../../../database/user/index.repo.js";
import AWS_SERVICE from "../../aws/index.service.js";
import prisma from "../../../database/index.db.js";
import OTP_SERVICE from "../OTP/persistentOtp.service.js";

/**
 * Emails a one-time login code to a passwordless user account. Accounts that have a password must use the
 * normal password login, so we reject those here.
 */
export default async function requestLoginOtp(email: string, ipAddress = "unknown") {
  if (!await OTP_SERVICE.recordOtpRequest(ipAddress, OtpPurpose.LOGIN)) return;
  const user = await USER_REPO.getUserWithCredentialByEmail(email);

  if (!user) return;
  if (user.mustChangePassword) return;
  if (user.credential && user.userRole !== "STUDENT") return;
  if (user.userRole === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { status: true } });
    if (profile?.status !== "ACTIVE") return;
  }

  const otp = await OTP_SERVICE.issuePersistentOtp(email, OtpPurpose.LOGIN, user.id, ipAddress);
  if (!otp) return;

  await AWS_SERVICE.EMAIL.sendEmail({
    to: [email],
    subject: "Your one-time login code",
    text: `Your one-time login code is: ${otp}\n\nIt expires in 10 minutes. If you didn't try to sign in, you can ignore this email.`,
  });

  return;
}
