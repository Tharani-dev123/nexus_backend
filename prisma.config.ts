import "dotenv/config";
import { defineConfig } from "prisma/config";

const migrationDatabaseUrl = () => {
  const configuredUrl = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];
  if (!configuredUrl) return undefined;

  try {
    const url = new URL(configuredUrl);

    // Neon recommends direct, unpooled connections for Prisma Migrate.
    if (url.hostname.includes("-pooler.")) {
      url.hostname = url.hostname.replace("-pooler.", ".");
    }

    // Give Neon time to wake an idle compute when the CLI connects.
    if (url.hostname.endsWith(".neon.tech") && !url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "20");
    }

    return url.toString();
  } catch {
    return configuredUrl;
  }
};

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationDatabaseUrl(),
  },
});
