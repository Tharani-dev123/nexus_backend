import checkRefreshTokenById from "./checkRefreshTokenById.service.js";
import extendRefreshToken from "./extendRefreshToken.service.js";
import generateRefreshToken from "./generateRefreshToken.service.js";
import validateStoredRefreshToken from "./validateRefreshToken.service.js";
import verifyRefreshTokenSignature from "./verifyRefreshToken.service.js";

export interface RefreshTokenOptions {
  user_id: string;
  expiresInSeconds?: number;
}

const REFRESH_TOKEN_SERVICE = {
  validateStoredRefreshToken,
  checkRefreshTokenById,
  generateRefreshToken,
  verifyRefreshTokenSignature,
  extendRefreshToken,
};

export default REFRESH_TOKEN_SERVICE;
