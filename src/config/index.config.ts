import { config } from "dotenv";
import pkg from "../../package.json" with { type: "json" };

config({ path: ".env" });

const CONFIG = process.env;
CONFIG.APP_VERSION = pkg.version;

function getConfigValue(key: string, fallback?: string): string {
  if (CONFIG.NODE_ENV === "production") {
    if (!CONFIG[key]) {
      throw new Error(`Missing required config value for key: ${key}`);
    }
    return CONFIG[key] as string;
  } else return (CONFIG[key] as string) || fallback || "";
}

export default getConfigValue;
