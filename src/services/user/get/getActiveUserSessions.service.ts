import { User } from "@prisma/client";
import AUTH_REPO from "../../../database/auth/index.repo.js";

export default async function getActiveUserSessions(user: User) {
  const sessions = await AUTH_REPO.REFRESH_TOKEN.getAllRefreshTokenByUser(user);

  return sessions;
}
