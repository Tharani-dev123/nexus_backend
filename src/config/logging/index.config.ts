import getConfigValue from "../index.config.js";

const LOGGING_CONFIG = {
  CONSOLE_LOGGING:
    getConfigValue("CONSOLE_LOGGING", "true").toLowerCase() === "true",
  BETTERSTACK_LOG_PUSH:
    getConfigValue("BETTERSTACK_LOG_PUSH", "true").toLowerCase() === "true",
  BETTERSTACK_TOKEN: getConfigValue("BETTERSTACK_TOKEN"),
  BETTERSTACK_URL: getConfigValue("BETTERSTACK_URL"),
};

export default LOGGING_CONFIG;
