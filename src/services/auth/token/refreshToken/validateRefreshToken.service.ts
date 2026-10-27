import { RefreshToken } from "@prisma/client";
import { AppError } from "../../../../types/AppError.js";

export default async function validateStoredRefreshToken(
  storedToken: RefreshToken,
  userId: string,
) {
  if (
    !storedToken ||
    storedToken.userId !== userId ||
    storedToken.revokedAt ||
    storedToken.expiresAt < new Date()
  ) {
    throw new AppError("Invalid Refresh Token", 401);
  }
}
