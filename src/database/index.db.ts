import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import logger from "../config/logging/logger.config.js";
import SERVICE_CONFIG from "../config/service.config.js";

const adapter = new PrismaPg({ connectionString: SERVICE_CONFIG.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

prisma
  .$connect()
  .then(() => {
    logger.info(
      `Connected to ${(SERVICE_CONFIG.ENVIRONMENT || "").toUpperCase()} Neon database `,
    );
  })
  .catch((error: Error) => {
    logger.error("Error connecting to the database:", error);
  });

export default prisma;
