import AUTH_REPO from "../../../database/auth/index.repo.js";

export default async function logoutAllDevice(userId: string) {
  await AUTH_REPO.REFRESH_TOKEN.revokeAllRefreshTokensForUser(userId);

  return;
}
