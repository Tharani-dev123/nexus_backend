import { CredentialType, UserRole } from "@prisma/client";
import prisma from "../index.db.js";

export interface AcceptUserInviteParams {
  inviteId: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  passwordHash: string;
}

/**
 * Atomically turns an accepted user invite into a login account: creates the
 * User (+ Credential) with the granted role, attaches it to the company, and
 * marks the invite used.
 */
export default async function acceptUserInvite(params: AcceptUserInviteParams) {
  const { inviteId, email, name, role, companyId, passwordHash } = params;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        userRole: role,
        isEmailVerified: true,
        companyId,
        credential: {
          create: {
            type: CredentialType.EMAIL,
            passwordHash,
          },
        },
      },
    });

    await tx.userInvite.update({
      where: { id: inviteId },
      data: { usedAt: new Date() },
    });

    return user;
  });
}
