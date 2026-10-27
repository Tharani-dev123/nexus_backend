import bcrypt from "bcrypt";

const PASSWORD_SALT_ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(plain: string, passwordHash: string) {
  return bcrypt.compare(plain, passwordHash);
}
