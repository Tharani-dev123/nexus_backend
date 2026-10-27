import { Prisma, User } from "@prisma/client";
import prisma from "../../index.db.js";
import { CreateCompanyInput } from "../../../schemas/company/createCompany.schema.js";

export default async function createCompany(
  data: CreateCompanyInput,
  user: User,
  tx: Prisma.TransactionClient = prisma,
) {
  const company = await tx.company.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      rootUserId: user.id,

      users: {
        connect: {
          id: user.id,
        },
      },
    },
    include: {
      users: true,
      rootUser: true,
    },
  });

  await tx.user.update({
    where: {
      id: user.id,
    },
    data: {
      companyId: company.id,
    },
  });

  return company;
}