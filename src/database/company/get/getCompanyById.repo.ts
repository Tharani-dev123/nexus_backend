import prisma from "../../index.db.js";

export default async function getCompanyById(id: string) {
  return prisma.company.findFirst({
    where: { 
        id,
        deletedAt:null, 
    },
    include:{
        users: true,
        rootUser: true,
    }
  });
}