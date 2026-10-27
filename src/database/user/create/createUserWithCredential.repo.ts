import { CredentialType, Prisma } from "@prisma/client";
import prisma from "../../index.db.js";
import { SignupInput } from "../../../schemas/auth/signup.schema.js";

export default async function createUserWithCredential(
  data: SignupInput,
  passwordHash: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.user.create({
    data: {
      email: data.email,
      name: data.name,
      userRole: "OWNER",
      credential: {
        create: {
          type: CredentialType.EMAIL,
          passwordHash,
        },
      },
    },
  });
}
