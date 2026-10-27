import AUTH_REPO from "../../../database/auth/index.repo.js";

export default async function logoutSingleDeviceService(
  refreshTokenId: string,
) {
  return await AUTH_REPO.REFRESH_TOKEN.revokeRefreshTokenById(refreshTokenId);
}
