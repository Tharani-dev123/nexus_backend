import { JWT_CONSTANTS } from "../../../../constants/jwtConstants.constants.js";
import AUTH_REPO from "../../../../database/auth/index.repo.js";

export default async function extendRefreshToken(refreshTokenId: string) {
  const newExpiresAt = new Date(
    Date.now() + JWT_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
  );

  await AUTH_REPO.REFRESH_TOKEN.extendRefreshToken(
    refreshTokenId,
    newExpiresAt,
  );

  return newExpiresAt;
}
