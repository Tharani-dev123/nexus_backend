
import {Company} from "@prisma/client";
import jwt, { Secret } from "jsonwebtoken";
import { AppError } from "../../../types/AppError.js";
import { JWT_CONSTANTS } from "../../../constants/jwtConstants.constants.js";
import AUTH_CONFIG from "../../../config/auth.config.js";
import { sha256Base64Url } from "../../../utils/crypto.util.js";
import AUTH_REPO from "../../../database/auth/index.repo.js";
import REFRESH_TOKEN_SERVICE from "./refreshToken/index.service.js";

export type JwtPayload = {
  user_id: string;
  company_id?: string | null;
  rftoken_id: string;
  expiresTime: number;
};

export type JwtPayloadWithoutExpires = Omit<JwtPayload, "expiresTime">;

const generateAccessToken = (payload: JwtPayloadWithoutExpires) => {
  const expiresInSeconds = JWT_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN_SECONDS;
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    { ...payload, expiresTime: now + expiresInSeconds },
    AUTH_CONFIG.ACCESS_TOKEN.SECRET as Secret,
  );
};

const verifyToken = (token: string): JwtPayload => {
  const payload = jwt.verify(
    token,
    AUTH_CONFIG.ACCESS_TOKEN.SECRET as Secret,
  ) as JwtPayload;

  if (payload.expiresTime <= Math.floor(Date.now() / 1000)) {
    throw new AppError("TOKEN_EXPIRED", 401);
  }

  return payload;
};

async function refreshAccessToken(refreshToken: string) {
  const payload =
    REFRESH_TOKEN_SERVICE.verifyRefreshTokenSignature(refreshToken);

  const tokenHash = sha256Base64Url(refreshToken);

  const storedToken =
    await AUTH_REPO.REFRESH_TOKEN.findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    throw new AppError("Invalid Refresh Token", 401);
  }

  await REFRESH_TOKEN_SERVICE.validateStoredRefreshToken(
    storedToken,
    payload.user_id,
  );

  await REFRESH_TOKEN_SERVICE.extendRefreshToken(storedToken.id);

  const newAccessToken = generateAccessToken({
    user_id: payload.user_id,
    rftoken_id: storedToken.id,
  });

  return newAccessToken;
}

const ACCESS_TOKEN_SERVICE = {
  generateAccessToken,
  verifyToken,
  refreshAccessToken,
};

export default ACCESS_TOKEN_SERVICE;
