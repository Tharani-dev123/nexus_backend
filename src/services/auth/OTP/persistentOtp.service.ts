import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { OtpPurpose, Prisma } from "@prisma/client";
import prisma from "../../../database/index.db.js";
import getConfigValue from "../../../config/index.config.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_SEND_WINDOW_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_EMAIL = 3;
const MAX_SENDS_PER_IP = 20;
const MAX_VERIFY_PER_IP = 40;
const MAX_ATTEMPTS = 5;

function digest(value: string): string {
  const secret = process.env["AUTH_OTP_PEPPER"]?.trim() || getConfigValue("AUTH_ACCESS_TOKEN_SECRET");
  if (!secret) throw new Error("AUTH_OTP_PEPPER or AUTH_ACCESS_TOKEN_SECRET must be configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}

function subjectKey(email: string, purpose: OtpPurpose) {
  return digest(`subject:${purpose}:${email.trim().toLowerCase()}`);
}

function codeHash(email: string, purpose: OtpPurpose, code: string) {
  return digest(`code:${purpose}:${email.trim().toLowerCase()}:${code}`);
}

async function takeRateLimit(
  tx: Prisma.TransactionClient,
  key: string,
  maxCount: number,
  cooldownMs = 0,
  windowMs = EMAIL_SEND_WINDOW_MS,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const cooldownStart = new Date(now.getTime() - cooldownMs);
  const rows = await tx.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    INSERT INTO "OtpRateLimit" ("key", "count", "windowStartedAt", "lastRequestAt", "updatedAt")
    VALUES (${key}, 1, ${now}, ${now}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "OtpRateLimit"."windowStartedAt" <= ${windowStart} THEN 1 ELSE "OtpRateLimit"."count" + 1 END,
      "windowStartedAt" = CASE WHEN "OtpRateLimit"."windowStartedAt" <= ${windowStart} THEN ${now} ELSE "OtpRateLimit"."windowStartedAt" END,
      "lastRequestAt" = ${now},
      "updatedAt" = ${now}
    WHERE ("OtpRateLimit"."windowStartedAt" <= ${windowStart} OR "OtpRateLimit"."count" < ${maxCount})
      AND ("OtpRateLimit"."lastRequestAt" <= ${cooldownStart})
    RETURNING "count"
  `);
  return rows.length === 1 && rows[0].count <= maxCount;
}

export async function recordOtpRequest(ipAddress: string, purpose: OtpPurpose): Promise<boolean> {
  return prisma.$transaction((tx) => takeRateLimit(tx, digest(`ip-request:${purpose}:${ipAddress}`), MAX_SENDS_PER_IP));
}

export async function recordOtpVerificationAttempt(ipAddress: string, purpose: OtpPurpose): Promise<boolean> {
  return prisma.$transaction((tx) => takeRateLimit(tx, digest(`ip-verify-edge:${purpose}:${ipAddress}`), MAX_VERIFY_PER_IP));
}

export async function issuePersistentOtp(
  email: string,
  purpose: OtpPurpose,
  userId: string | null,
  ipAddress: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const code = randomInt(100000, 1000000).toString();
  const key = subjectKey(normalizedEmail, purpose);
  const now = new Date();
  if (randomInt(0, 100) === 0) {
    const retainAfter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await prisma.$transaction(async (tx) => {
      await tx.otpChallenge.deleteMany({ where: { expiresAt: { lt: retainAfter } } });
      await tx.otpRateLimit.deleteMany({ where: { windowStartedAt: { lt: retainAfter } } });
    });
  }

  const allowed = await prisma.$transaction(async (tx) => {
    const ipAllowed = await takeRateLimit(tx, digest(`ip-send:${purpose}:${ipAddress}`), MAX_SENDS_PER_IP);
    if (!ipAllowed) return false;
    const emailAllowed = await takeRateLimit(tx, digest(`email-send:${purpose}:${normalizedEmail}`), MAX_SENDS_PER_EMAIL, RESEND_COOLDOWN_MS);
    if (!emailAllowed) return false;

    await tx.otpChallenge.upsert({
      where: { subjectKey_purpose: { subjectKey: key, purpose } },
      create: {
        subjectKey: key, userId, purpose, codeHash: codeHash(normalizedEmail, purpose, code),
        expiresAt: new Date(now.getTime() + OTP_TTL_MS), windowStartedAt: now, lastSentAt: now,
      },
      update: {
        userId, codeHash: codeHash(normalizedEmail, purpose, code), expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        attempts: 0, lastSentAt: now,
      },
    });
    return true;
  });

  return allowed ? code : null;
}

export async function consumePersistentOtp(
  email: string,
  purpose: OtpPurpose,
  otp: string,
  userId: string,
  ipAddress: string,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  return prisma.$transaction(async (tx) => {
    const ipAllowed = await takeRateLimit(tx, digest(`ip-verify:${purpose}:${ipAddress}`), MAX_VERIFY_PER_IP);
    if (!ipAllowed) return false;
    const key = subjectKey(normalizedEmail, purpose);
    const challenge = await tx.otpChallenge.findUnique({ where: { subjectKey_purpose: { subjectKey: key, purpose } } });
    const now = new Date();
    if (!challenge || challenge.userId !== userId || challenge.consumedAt || challenge.expiresAt <= now) return false;
    if (challenge.attempts >= MAX_ATTEMPTS) return false;

    const expected = Buffer.from(challenge.codeHash, "hex");
    const actual = Buffer.from(codeHash(normalizedEmail, purpose, otp), "hex");
    const matches = expected.length === actual.length && timingSafeEqual(expected, actual);
    const claimed = await tx.otpChallenge.updateMany({
      where: { id: challenge.id, attempts: challenge.attempts, consumedAt: null, expiresAt: { gt: now } },
      data: matches
        ? { consumedAt: now }
        : { attempts: { increment: 1 }, ...(challenge.attempts + 1 >= MAX_ATTEMPTS ? { consumedAt: now } : {}) },
    });
    return matches && claimed.count === 1;
  });
}

export async function invalidateOtp(email: string, purpose: OtpPurpose) {
  const key = subjectKey(email, purpose);
  await prisma.otpChallenge.updateMany({ where: { subjectKey: key, purpose, consumedAt: null }, data: { consumedAt: new Date() } });
}

export default { issuePersistentOtp, consumePersistentOtp, invalidateOtp, recordOtpRequest, recordOtpVerificationAttempt };
