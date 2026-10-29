import { Request } from "express";
import { OtpPurpose } from "@prisma/client";
import USER_REPO from "../../../database/user/index.repo.js";
import { AppError } from "../../../types/AppError.js";
import AUTH_SERVICE from "../index.service.js";
import buildLoginAccess from "./buildLoginAccess.service.js";
import { getDeviceInfoAndIp } from "../../../utils/deviceInfo.util.js";
import prisma from "../../../database/index.db.js";
import OTP_SERVICE from "../OTP/persistentOtp.service.js";

/**
 * Completes a passwordless login: validates the emailed one-time code and, on
 * success, issues access + refresh tokens. The code is single-use (the cache
 * consumes it on a correct match).
 */
export default async function verifyLoginOtp(email: string, otp: string, req?: Request) {
  if (!await OTP_SERVICE.recordOtpVerificationAttempt(req?.ip ?? "unknown", OtpPurpose.LOGIN)) throw new AppError("Invalid or expired login code", 401);
  const user = await USER_REPO.getUserWithCredentialByEmail(email);

  if (!user) {
    throw new AppError("Invalid or expired login code", 401);
  }

  if (user.mustChangePassword || (user.credential && user.userRole !== "STUDENT")) {
    await OTP_SERVICE.invalidateOtp(email, OtpPurpose.LOGIN);
    throw new AppError("Invalid or expired login code", 401);
  }
  if (user.userRole === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { status: true } });
    if (profile?.status !== "ACTIVE") {
      await OTP_SERVICE.invalidateOtp(email, OtpPurpose.LOGIN);
      throw new AppError("Invalid or expired login code", 401);
    }
  }

  const valid = await OTP_SERVICE.consumePersistentOtp(email, OtpPurpose.LOGIN, otp, user.id, req?.ip ?? "unknown");
  if (!valid) {
    throw new AppError("Invalid or expired login code", 401);
  }

  if (user.userRole === "STUDENT" && !user.isEmailVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
  }

  const refreshToken = await AUTH_SERVICE.REFRESH_TOKEN.generateRefreshToken({
    user_id: user.id,
  });

  const accessToken = AUTH_SERVICE.ACCESS_TOKEN.generateAccessToken({
    user_id: user.id,
    company_id: user.companyId ?? undefined,
    rftoken_id: refreshToken.rftoken_id,
  });

  // Subscription & module-access snapshot for the dynamic sidebar.
  const access = await buildLoginAccess(user.companyId, user.userRole);

  const { ipAddress, deviceName } = getDeviceInfoAndIp(req);

  return {
    user: {
      id: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      companyId: user.companyId,
      userRole: user.userRole,
      createdAt: user.createdAt,
      mustChangePassword: user.mustChangePassword,
    },
    accessToken,
    refreshToken: refreshToken.refreshToken,
    companyId: user.companyId,
    ipAddress,
    deviceName,
    subscription: access?.subscription ?? null,
    enabledModules: access?.enabledModules ?? [],
    navigation: access?.navigation ?? null,
  };
}
