import { Request } from "express";
import { AppError } from "../../types/AppError.js";
import USER_INVITE_REPO from "../../database/userInvite/index.repo.js";
import USER_REPO from "../../database/user/index.repo.js";
import { sha256Base64Url } from "../../utils/crypto.util.js";
import AUTH_SERVICE from "../auth/index.service.js";
import { getDeviceInfoAndIp } from "../../utils/deviceInfo.util.js";

/**
 * Accepts a user invite: validates the token, creates the User (+ Credential)
 * with the granted role, marks the invite used, and returns tokens so the new
 * organization user is logged in immediately.
 */
export default async function acceptUserInvite(token: string, password: string, req?: Request) {
  const invite = await USER_INVITE_REPO.getUserInviteByTokenHash(
    sha256Base64Url(token),
  );

  if (!invite) {
    throw new AppError("Invalid invite link", 400);
  }
  if (invite.usedAt) {
    throw new AppError("This invite has already been used", 400);
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    throw new AppError("This invite link has expired", 400);
  }

  const existingUser = await USER_REPO.getUserByEmail(invite.email);
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await AUTH_SERVICE.PASSWORD.hashPassword(password);

  const user = await USER_INVITE_REPO.acceptUserInvite({
    inviteId: invite.id,
    email: invite.email,
    name: invite.name,
    role: invite.role,
    companyId: invite.companyId,
    passwordHash,
  });

  const refreshToken = await AUTH_SERVICE.REFRESH_TOKEN.generateRefreshToken({
    user_id: user.id,
  });

  const accessToken = AUTH_SERVICE.ACCESS_TOKEN.generateAccessToken({
    user_id: user.id,
    company_id: user.companyId ?? undefined,
    rftoken_id: refreshToken.rftoken_id,
  });

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
    ipAddress,
    deviceName,
  };
}
