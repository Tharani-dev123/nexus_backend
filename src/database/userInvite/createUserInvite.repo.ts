import { UserRole } from "@prisma/client";
import prisma from "../index.db.js";

export interface CreateUserInviteParams {
  companyId: string;
  email: string;
  name: string;
  role: UserRole;
  tokenHash: string;
  expiresAt: Date;
}

export default async function createUserInvite(
  params: CreateUserInviteParams,
) {
  return prisma.userInvite.create({
    data: {
      companyId: params.companyId,
      email: params.email,
      name: params.name,
      role: params.role,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
    },
  });
}
