import USER_CREDENTIALS_REPO from "./credentials/index.repo.js";
import REFRESH_TOKEN_REPO from "./refresh-token/index.repo.js";

const AUTH_REPO = {
  REFRESH_TOKEN: { ...REFRESH_TOKEN_REPO },
  PASSWORD: { ...USER_CREDENTIALS_REPO.PASSWORD },
};

export default AUTH_REPO;
