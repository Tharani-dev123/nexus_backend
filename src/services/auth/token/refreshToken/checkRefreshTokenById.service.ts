import AUTH_REPO from "../../../../database/auth/index.repo.js";
import { AppError } from "../../../../types/AppError.js";
import AUTH_SERVICE from "../../index.service.js";

export default async function checkRefreshTokenById(
  refreshTokenId: string,
  userId: string,
) {
  const storedToken =
    await AUTH_REPO.REFRESH_TOKEN.getRefreshTokenById(refreshTokenId);

  if (!storedToken) {
    throw new AppError("Refresh Token not found", 401);
  }

  await AUTH_SERVICE.REFRESH_TOKEN.validateStoredRefreshToken(
    storedToken,
    userId,
  );
  return;
}
