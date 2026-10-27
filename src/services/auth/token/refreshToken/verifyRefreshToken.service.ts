import jwt from "jsonwebtoken";
import AUTH_CONFIG from "../../../../config/auth.config.js";
import { RefreshTokenOptions } from "./index.service.js";

const verifyRefreshTokenSignature = (refreshToken: string) => {
  return jwt.verify(
    refreshToken,
    AUTH_CONFIG.REFRESH_TOKEN.SECRET,
  ) as RefreshTokenOptions;
};

export default verifyRefreshTokenSignature;
