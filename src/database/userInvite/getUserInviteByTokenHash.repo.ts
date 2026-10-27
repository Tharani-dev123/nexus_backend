import prisma from "../index.db.js";

export default async function getUserInviteByTokenHash(tokenHash: string) {
  return prisma.userInvite.findFirst({
    where: { tokenHash },
  });
}
