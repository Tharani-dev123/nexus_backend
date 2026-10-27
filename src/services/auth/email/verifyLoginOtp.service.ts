import { Request } from "express";
import otpLoginCache from "../../../config/cache/otpLogin.cache.js";
import USER_REPO from "../../../database/user/index.repo.js";
import { AppError } from "../../../types/AppError.js";
import AUTH_SERVICE from "../index.service.js";
import buildLoginAccess from "./buildLoginAccess.service.js";
import { getDeviceInfoAndIp } from "../../../utils/deviceInfo.util.js";

/**
 * Completes a passwordless login: validates the emailed one-time code and, on
 * success, issues access + refresh tokens. The code is single-use (the cache
 * consumes it on a correct match).
 */
export default async function verifyLoginOtp(email: string, otp: string, req?: Request) {
  const user = await USER_REPO.getUserByEmail(email);

  if (!user) {
    throw new AppError("Invalid or expired login code", 401);
  }

  const valid = otpLoginCache.validate(user.id, otp);
  if (!valid) {
    throw new AppError("Invalid or expired login code", 401);
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
