import { createHash, randomBytes } from "crypto";

export function sha256Base64Url(input: string) {
  return createHash("sha256").update(input).digest("base64url");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

