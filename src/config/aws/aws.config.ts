import getConfigValue from "../index.config.js";

const AWS_CONFIG = {
  region: getConfigValue("AWS_REGION", "us-east-1"),
  credentials: {
    accessKeyId: getConfigValue("FCX_AWS_ACCESS_KEY") as string,
    secretAccessKey: getConfigValue("FCX_AWS_ACCESS_KEY_SECRET") as string,
  },
};

export default AWS_CONFIG;
