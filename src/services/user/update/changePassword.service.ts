import USER_REPO from "../../../database/user/index.repo.js";
import AUTH_SERVICE from "../../auth/index.service.js";
import { AppError } from "../../../types/AppError.js";
import AUTH_REPO from "../../../database/auth/index.repo.js";
import prisma from "../../../database/index.db.js";

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await USER_REPO.getUserWithCredentialById(userId);
  if (!user || !user.credential) throw new AppError("Unauthorized", 401);

  const ok = await AUTH_SERVICE.PASSWORD.verifyPassword(
    currentPassword,
    user.credential.passwordHash,
  );
  if (!ok) throw new AppError("Invalid credentials", 401);

  const newHash = await AUTH_SERVICE.PASSWORD.hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    await AUTH_REPO.PASSWORD.update(user, newHash, tx);
    await tx.user.update({ where: { id: userId }, data: { mustChangePassword: false } });
  });
}
