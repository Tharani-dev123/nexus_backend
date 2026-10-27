import "dotenv/config";
import { PrismaClient, CredentialType, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { SUBSCRIPTION_PLAN_SEED } from "../src/constants/subscription/plans.constant.js";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

async function seedSubscriptionPlans() {
  for (const plan of SUBSCRIPTION_PLAN_SEED) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      // Refresh catalogue metadata on re-run; companies' subscriptions are untouched.
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
      },
      create: {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
      },
    });
  }
  console.log(`Seeded ${SUBSCRIPTION_PLAN_SEED.length} subscription plans.`);
}

async function seedSuperAdmin() {
  console.log("Running Super Admin Seed...");
  
  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@auronox.com";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@123";
  const name = process.env.SUPER_ADMIN_NAME ?? "Auronox Super Admin";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("✅ Super Admin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        userRole: UserRole.SUPER_ADMIN,
        isEmailVerified: true,
        companyId: null,
      },
    });

    await tx.credential.create({
      data: {
        userId: user.id,
        type: CredentialType.EMAIL,
        passwordHash,
      },
    });
  });

  console.log("✅ Super Admin created successfully");
}

async function main() {
  await seedSuperAdmin();
  await seedSubscriptionPlans();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
