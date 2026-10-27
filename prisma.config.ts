import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // GitHub Actions maps the branch-specific secret to DATABASE_URL.
    // Direct access also keeps validate/generate usable without a DB URL.
    url: process.env["DATABASE_URL"],
  },
});
