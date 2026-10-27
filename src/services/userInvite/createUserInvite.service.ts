import { UserRole } from "@prisma/client";
import USER_INVITE_REPO from "../../database/userInvite/index.repo.js";
import USER_REPO from "../../database/user/index.repo.js";
import AWS_SERVICE from "../aws/index.service.js";
import { randomToken, sha256Base64Url } from "../../utils/crypto.util.js";
import { USER_INVITE_CONSTANTS } from "../../constants/invite.constants.js";
import SERVICE_CONFIG from "../../config/service.config.js";
import { AppError } from "../../types/AppError.js";

export interface CreateUserInviteInput {
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Invites an organization user to a company: creates an invite token and
 * emails them a link to set their password. Owner-only (enforced by the route).
 * Email delivery errors are surfaced because email is the only way the invitee
 * receives the link.
 */
export default async function createUserInvite(
  companyId: string,
  data: CreateUserInviteInput,
) {
  if (!USER_INVITE_CONSTANTS.ALLOWED_ROLES.includes(data.role as never)) {
    throw new AppError(
      `Role must be one of: ${USER_INVITE_CONSTANTS.ALLOWED_ROLES.join(", ")}`,
      400,
    );
  }

  const existingUser = await USER_REPO.getUserByEmail(data.email);
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const rawToken = randomToken();
  const tokenHash = sha256Base64Url(rawToken);
  const expiresAt = new Date(
    Date.now() + USER_INVITE_CONSTANTS.TOKEN_EXPIRES_IN_SECONDS * 1000,
  );

  const invite = await USER_INVITE_REPO.createUserInvite({
    companyId,
    email: data.email,
    name: data.name,
    role: data.role,
    tokenHash,
    expiresAt,
  });

  const link = `${SERVICE_CONFIG.FRONTEND_URL}${USER_INVITE_CONSTANTS.ACCEPT_PATH}?token=${rawToken}`;

  await AWS_SERVICE.EMAIL.sendEmail({
    to: [data.email],
    subject: "You've been invited to join — set up your login",
    text: `Hi ${data.name},\n\nYou've been invited to join as ${data.role}. Set your password to activate your login:\n\n${link}\n\nThis link expires in 72 hours.`,
  });

  return {
    id: invite.id,
    email: invite.email,
    name: invite.name,
    role: invite.role,
    expiresAt: invite.expiresAt,
  };
}
