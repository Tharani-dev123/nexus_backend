import { Secret } from "jsonwebtoken";
import getConfigValue from "./index.config.js";

const AUTH_CONFIG = {
  ACCESS_TOKEN: {
    SECRET: getConfigValue(
      "AUTH_ACCESS_TOKEN_SECRET",
      "dev_access_secret_change_me",
    ),
  },
  REFRESH_TOKEN: {
    SECRET: getConfigValue(
      "AUTH_REFRESH_TOKEN_SECRET",
      "dev_refresh_secret_change_me",
    ) as Secret,
  },
};

export default AUTH_CONFIG;
