import getConfigValue from "./index.config.js";

const SERVICE_CONFIG = {
  NAME: getConfigValue("SERVICE_NAME", "Auth"),
  PORT: getConfigValue("PORT", "3000"),
  DATABASE_URL: getConfigValue("DATABASE_URL"),
  ENVIRONMENT: getConfigValue("NODE_ENV", "development"),
  VERSION: getConfigValue("APP_VERSION", "1.0.0"),
  CORS_ORIGIN: getConfigValue("CORS_ORIGIN","https://tds-mocha-five.vercel.app"),
  FRONTEND_URL: getConfigValue(
    "FRONTEND_URL",
    getConfigValue("CORS_ORIGIN","https://tds-mocha-five.vercel.app"),
  ),
  TRUST_PROXY:
    getConfigValue("TRUST_PROXY") === "true"
      ? true
      : Number.isFinite(Number(getConfigValue("TRUST_PROXY")))
        ? Number(getConfigValue("TRUST_PROXY"))
        : getConfigValue("TRUST_PROXY"),
};

export default SERVICE_CONFIG;
