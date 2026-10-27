import { Server } from "http";
import logger from "../config/logging/logger.config.js";

type CleanupFn = () => Promise<void> | void;

export function setupGracefulShutdown(
  server: Server,
  cleanupFns: CleanupFn[] = []
) {
  async function shutdown(signal: string) {
    logger.warn(`[Graceful Shutdown] Received ${signal}. Starting cleanup...`);

    try {
      // Run cleanup functions (e.g., close DB, queues)
      for (const fn of cleanupFns) {
        await fn();
      }
    } catch (err) {
      logger.error("[Graceful Shutdown] Error during cleanup:", err);
    }

    // Stop accepting new connections
    server.close(() => {
      logger.warn("[Graceful Shutdown] Server closed. Exiting.");
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error("[Graceful Shutdown] Forced shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  }

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => shutdown(signal));
  });

  // Handle unexpected errors
  process.on("uncaughtException", (err) => {
    logger.error("[Uncaught Exception]:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("[Unhandled Rejection]:", reason);
    process.exit(1);
  });
}
