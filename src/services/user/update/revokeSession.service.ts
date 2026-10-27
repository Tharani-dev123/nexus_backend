import AUTH_REPO from "../../../database/auth/index.repo.js";
import { AppError } from "../../../types/AppError.js";

export default async function revokeSession(sessionId: string) {
  const storedToken =
    await AUTH_REPO.REFRESH_TOKEN.getRefreshTokenById(sessionId);

  if (!storedToken) throw new AppError("Invalid Session Id", 400);

  await AUTH_REPO.REFRESH_TOKEN.revokeRefreshTokenById(sessionId);
  return;
}
