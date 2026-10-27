import prisma from "../../database/index.db.js";
import { AppError } from "../../types/AppError.js";
import buildNavigation from "../subscription/access/buildNavigation.service.js";

export default async function getCompanySubscription(companyId: string) {
  // 1. Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId, deletedAt: null },
  });
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // 2. Fetch current active or latest subscription
  const currentSubscription = await prisma.companySubscription.findFirst({
    where: { companyId, isActive: true },
    include: { plan: true },
  });

  // 3. Fetch enabled modules
  const modulesList = await prisma.companyModule.findMany({
    where: { companyId, isEnabled: true },
    select: { moduleCode: true },
  });
  const modules = modulesList.map((m) => m.moduleCode);

  // 4. Build navigation sidebar payload
  const navigation = await buildNavigation(
    { userRole: "OWNER" },
    { id: companyId },
    currentSubscription,
    modules,
  );

  // 5. Fetch subscription audit history from the generic AuditLog table
  const auditHistory = await prisma.auditLog.findMany({
    where: {
      companyId,
      entityType: "CompanySubscription",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Extract payment records from activations or renewals containing payment info
  const paymentHistory = auditHistory
    .filter((log) => log.action === "ACTIVATE" || log.action === "RENEW")
    .map((log) => {
      const val = log.newValue as any;
      if (val?.paymentReference || val?.paymentMode || val?.amount) {
        return {
          id: log.id,
          action: log.action,
          amount: val.amount || 0,
          paymentMode: val.paymentMode || "—",
          paymentReference: val.paymentReference || "—",
          invoiceNumber: val.invoiceNumber || "—",
          notes: val.notes || "—",
          createdAt: log.createdAt,
        };
      }
      return null;
    })
    .filter((p) => p !== null);

  // Extract renewal events
  const renewalHistory = auditHistory
    .filter((log) => log.action === "RENEW")
    .map((log) => {
      const val = log.newValue as any;
      return {
        id: log.id,
        durationMonths: val?.durationMonths || 0,
        oldEndDate: val?.oldEndDate || null,
        newEndDate: val?.newEndDate || null,
        createdAt: log.createdAt,
      };
    });

  // Usage limits
  const limits = {
    maxStorageGb: currentSubscription?.plan?.code === "FULL_SUITE" ? 50 : 10,
  };

  return {
    company,
    subscription: currentSubscription,
    modules,
    limits,
    navigation,
    paymentHistory,
    renewalHistory,
    auditHistory,
  };
}
