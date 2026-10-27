import app from "./server.js";
import logger from "./config/logging/logger.config.js";
import { setupGracefulShutdown } from "./utils/shutdown.js";
import SERVICE_CONFIG from "./config/service.config.js";

const server = app.listen(SERVICE_CONFIG.PORT, () => {
  logger.info(
    ` ${SERVICE_CONFIG.NAME?.toUpperCase()} running on port ${SERVICE_CONFIG.PORT} (Version: ${SERVICE_CONFIG.VERSION})`,
  );
});


setupGracefulShutdown(server);
