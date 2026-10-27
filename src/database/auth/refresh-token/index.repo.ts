import createRefreshToken from "./create/createRefreshToken.repo.js";
import findRefreshTokenByHash from "./get/findRefreshTokenByHash.repo.js";
import getAllRefreshTokenByUser from "./get/getAllRefreshToken.repo.js";
import getRefreshTokenById from "./get/getRefreshTokenById.repo.js";
import revokeAllRefreshTokensForUser from "./revoke/revokeAllRefreshTokensForUser.repo.js";
import revokeRefreshTokenByHash from "./revoke/revokeRefreshTokenByHash.repo.js";
import revokeRefreshTokenById from "./revoke/revokeRefreshTokenById.repo.js";
import extendRefreshToken from "./update/extendRefreshToken.repo.js";

const REFRESH_TOKEN_REPO = {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeAllRefreshTokensForUser,
  revokeRefreshTokenByHash,
  revokeRefreshTokenById,
  getRefreshTokenById,
  extendRefreshToken,
  getAllRefreshTokenByUser,
};

export default REFRESH_TOKEN_REPO;
