import { Prisma, User } from "@prisma/client";
import { UpdateUserInput } from "../../../schemas/user/updateUser.schema.js";
import prisma from "../../index.db.js";

export default async function updateUserRepo(
  user: User,
  data: UpdateUserInput,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
    },
  });
}
