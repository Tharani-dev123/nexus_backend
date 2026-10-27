import jwt from "jsonwebtoken";
import AUTH_CONFIG from "../../../../config/auth.config.js";
import AUTH_REPO from "../../../../database/auth/index.repo.js";
import { sha256Base64Url } from "../../../../utils/crypto.util.js";
import { JWT_CONSTANTS } from "../../../../constants/jwtConstants.constants.js";

import { RefreshTokenOptions } from "./index.service.js";

export interface RefreshTokenPayload {
  refreshToken: string;
  expiresAt: Date;
  rftoken_id: string;
}

export default async function generateRefreshToken(
  data: RefreshTokenOptions,
): Promise<RefreshTokenPayload> {
  const refreshToken = jwt.sign(
    {
      user_id: data.user_id,
       type: "refresh",
    },
    AUTH_CONFIG.REFRESH_TOKEN.SECRET,
  );

  const tokenHash = sha256Base64Url(refreshToken);

  const expiresAt = new Date(
    Date.now() + JWT_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
  );

  const rf = await AUTH_REPO.REFRESH_TOKEN.createRefreshToken(
    data.user_id,
    tokenHash,
    expiresAt,
  );

  return {
    refreshToken,
    expiresAt,
    rftoken_id: rf.id,
  };
}
