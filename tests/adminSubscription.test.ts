import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../src/database/index.db.js";
import SUBSCRIPTION_REPO from "../src/database/subscription/index.repo.js";
import subscribeCompany from "../src/services/subscription/subscription/subscribeCompany.service.js";
import activateSubscription from "../src/services/adminSubscription/activateSubscription.service.js";
import renewSubscription from "../src/services/adminSubscription/renewSubscription.service.js";
import cancelSubscription from "../src/services/adminSubscription/cancelSubscription.service.js";
import getCompanySubscription from "../src/services/adminSubscription/getCompanySubscription.service.js";
import getPendingCompanies from "../src/services/adminSubscription/getPendingCompanies.service.js";
import checkAndExpireSubscription from "../src/services/subscription/subscription/checkAndExpireSubscription.service.js";
import getModuleAccessContext from "../src/services/subscription/access/getModuleAccessContext.service.js";
import { AppError } from "../src/types/AppError.js";

// Mock the Prisma DB client
vi.mock("../src/database/index.db.js", () => {
  const mockPrisma = {
    company: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    companySubscription: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    companyModule: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(async (cb) => cb(mockPrisma)),
  };
  return {
    default: mockPrisma,
  };
});

// Mock the SUBSCRIPTION_REPO database layer
vi.mock("../src/database/subscription/index.repo.js", () => {
  return {
    default: {
      getPlanByCode: vi.fn(),
      getActiveSubscription: vi.fn(),
    },
  };
});

// Mock getEnabledModules service
vi.mock("../src/services/subscription/module/getEnabledModules.service.js", () => {
  return {
    default: vi.fn().mockResolvedValue(["TAX_DECLARATION"]),
  };
});

// Mock the subscription engine provisioning service
vi.mock("../src/services/subscription/subscription/subscribeCompany.service.js", () => {
  return {
    default: vi.fn().mockResolvedValue({}),
  };
});

describe("Admin Subscription Services & Expiry Engine", () => {
  const adminUserId = "super-admin-uuid";
  const companyId = "3f886f6d-74d3-4fae-9d22-26f63458de05";
  const mockCompany = { id: companyId, name: "Acme Corp", email: "info@acme.com", rootUserId: "owner-1" };
  const mockPlan = { id: "plan-tds-uuid", code: "TDS", isActive: true };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("activateSubscription", () => {
    it("should successfully activate a new subscription with full payment metadata", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      vi.mocked(SUBSCRIPTION_REPO.getPlanByCode).mockResolvedValue(mockPlan as any);
      vi.mocked(SUBSCRIPTION_REPO.getActiveSubscription).mockResolvedValue(null);

      const mockSubRecord = { id: "sub-1", companyId, planId: mockPlan.id, plan: mockPlan, status: "ACTIVE", isActive: true };
      vi.mocked(prisma.companySubscription.findFirst).mockResolvedValue(mockSubRecord as any);

      const res = await activateSubscription(adminUserId, {
        companyId,
        planCode: "TDS",
        durationMonths: 12,
        paymentReference: "UPI123",
        paymentMode: "UPI",
        amount: 15000,
        currency: "INR",
        invoiceNumber: "INV-2026-001",
        notes: "Annual TDS Payment",
      });

      expect(res).toEqual(mockSubRecord);
      expect(subscribeCompany).toHaveBeenCalledWith(
        companyId,
        expect.objectContaining({
          planCode: "TDS",
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
        expect.any(Object),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: adminUserId,
            action: "ACTIVATE",
            entityType: "CompanySubscription",
            entityId: "sub-1",
            newValue: expect.objectContaining({
              entity: "SUBSCRIPTION",
              newPlan: "TDS",
              paymentReference: "UPI123",
              paymentMode: "UPI",
              amount: 15000,
              currency: "INR",
              invoiceNumber: "INV-2026-001",
            }),
          }),
        }),
      );
    });

    it("should throw 409 if company already has an active subscription for the same plan", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      vi.mocked(SUBSCRIPTION_REPO.getPlanByCode).mockResolvedValue(mockPlan as any);
      vi.mocked(SUBSCRIPTION_REPO.getActiveSubscription).mockResolvedValue({
        plan: { code: "TDS" },
        isActive: true,
      } as any);

      await expect(
        activateSubscription(adminUserId, {
          companyId,
          planCode: "TDS",
          durationMonths: 12,
        }),
      ).rejects.toThrowError(
        new AppError("Company already has an active subscription for this plan", 409),
      );
    });
  });

  describe("renewSubscription", () => {
    it("should extend the end date if the subscription is active", async () => {
      const activeEndDate = new Date("2026-12-31T00:00:00.000Z");
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      vi.mocked(SUBSCRIPTION_REPO.getActiveSubscription).mockResolvedValue({
        id: "sub-1",
        plan: { code: "TDS" },
        endDate: activeEndDate,
        isActive: true,
        status: "ACTIVE",
      } as any);
      vi.mocked(prisma.companySubscription.update).mockResolvedValue({
        id: "sub-1",
        endDate: new Date("2027-12-31T00:00:00.000Z"),
      } as any);

      const res = await renewSubscription(adminUserId, {
        companyId,
        durationMonths: 12,
      });

      expect(res.endDate).toBeDefined();
      expect(prisma.companySubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-1" },
          data: { endDate: expect.any(Date) },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: adminUserId,
            action: "RENEW",
            entityType: "CompanySubscription",
            entityId: "sub-1",
          }),
        }),
      );
    });

    it("should create a new subscription if expired and history exists", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      vi.mocked(SUBSCRIPTION_REPO.getActiveSubscription).mockResolvedValue(null);
      vi.mocked(prisma.companySubscription.findFirst).mockResolvedValue({
        id: "sub-old",
        plan: { code: "TDS" },
        endDate: new Date("2025-12-31"),
      } as any);

      const res = await renewSubscription(adminUserId, {
        companyId,
        durationMonths: 12,
      });

      expect(res.endDate).toBeDefined();
      expect(subscribeCompany).toHaveBeenCalledWith(
        companyId,
        expect.objectContaining({
          planCode: "TDS",
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
        expect.any(Object),
      );
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel active subscription, disable modules, and return disabled modules count", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      vi.mocked(SUBSCRIPTION_REPO.getActiveSubscription).mockResolvedValue({
        id: "sub-1",
        plan: { code: "TDS" },
      } as any);
      vi.mocked(prisma.companyModule.updateMany).mockResolvedValue({ count: 4 } as any);

      const res = await cancelSubscription(adminUserId, { companyId });

      expect(res.disabledModulesCount).toBe(4);
      expect(prisma.companySubscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId, isActive: true },
          data: expect.objectContaining({ status: "CANCELLED", isActive: false }),
        }),
      );
      expect(prisma.companyModule.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId, isEnabled: true },
          data: { isEnabled: false },
        }),
      );
    });
  });

  describe("getCompanySubscription", () => {
    it("should return detailed subscription object with audit logs", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      vi.mocked(prisma.companySubscription.findFirst).mockResolvedValue({ id: "sub-1" } as any);
      vi.mocked(prisma.companyModule.findMany).mockResolvedValue([
        { moduleCode: "TAX_DECLARATION" },
      ] as any);
      vi.mocked(prisma.companySubscription.findMany).mockResolvedValue([{ id: "sub-1" }] as any);
      const mockAuditLogs = [{ id: "audit-1", action: "ACTIVATE" }];
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockAuditLogs as any);

      const res = await getCompanySubscription(companyId);

      expect(res.company).toEqual(expect.objectContaining({ id: companyId }));
      expect(res.subscription).toEqual({ id: "sub-1" });
      expect(res.modules).toEqual(["TAX_DECLARATION"]);
      expect(res.auditHistory).toEqual(mockAuditLogs);
    });
  });

  describe("getPendingCompanies", () => {
    it("should return pending list from database", async () => {
      vi.mocked(prisma.company.findMany).mockResolvedValue([mockCompany] as any);

      const res = await getPendingCompanies();

      expect(res).toEqual([mockCompany]);
    });
  });

  describe("checkAndExpireSubscription", () => {
    it("should automatically expire subscription and disable modules if endDate is in past", async () => {
      const pastDate = new Date("2026-01-01T00:00:00.000Z");
      const expiredSub = {
        id: "sub-exp",
        companyId,
        isActive: true,
        status: "ACTIVE",
        endDate: pastDate,
        plan: { code: "TDS" },
        company: mockCompany,
      };

      vi.mocked(prisma.companySubscription.findFirst).mockResolvedValue(expiredSub as any);

      const res = await checkAndExpireSubscription(companyId);

      expect(res).toBeNull(); // Expired subscription returns null
      expect(prisma.companySubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-exp" },
          data: { isActive: false, status: "EXPIRED" },
        }),
      );
      expect(prisma.companyModule.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId },
          data: { isEnabled: false },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "EXPIRE",
            entityType: "CompanySubscription",
            entityId: "sub-exp",
          }),
        }),
      );
    });

    it("should return the subscription if not expired", async () => {
      const futureDate = new Date("2030-01-01T00:00:00.000Z");
      const activeSub = {
        id: "sub-active",
        companyId,
        isActive: true,
        status: "ACTIVE",
        endDate: futureDate,
        plan: { code: "TDS" },
        company: mockCompany,
      };

      vi.mocked(prisma.companySubscription.findFirst).mockResolvedValue(activeSub as any);

      const res = await checkAndExpireSubscription(companyId);

      expect(res).toEqual(activeSub);
      expect(prisma.companySubscription.update).not.toHaveBeenCalled();
    });
  });

  describe("getModuleAccessContext", () => {
    it("should run expiration check first and then resolve access snapshot", async () => {
      const futureDate = new Date("2030-01-01T00:00:00.000Z");
      const activeSub = {
        id: "sub-active",
        companyId,
        isActive: true,
        status: "ACTIVE",
        endDate: futureDate,
        plan: { code: "TDS", name: "TDS Plan" },
        company: mockCompany,
        startDate: new Date(),
      };

      vi.mocked(prisma.companySubscription.findFirst).mockResolvedValue(activeSub as any);

      const res = await getModuleAccessContext(companyId, "OWNER");

      expect(res.companyId).toBe(companyId);
      expect(res.subscription).toEqual(
        expect.objectContaining({
          id: "sub-active",
          planCode: "TDS",
          isActive: true,
        }),
      );
      expect(res.enabledModules).toEqual(["TAX_DECLARATION"]);
      expect(res.capabilities.leaveDrivesAttendance).toBe(false);
    });
  });

  describe("listAllSubscriptions", () => {
    it("should correctly handle pagination, search, filter, and sorting", async () => {
      const mockItems = [
        {
          id: "comp-1",
          name: "Auronox Corp",
          email: "info@auronox.com",
          createdAt: new Date(),
          subscriptionId: "sub-1",
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          currentPlan: "Full Suite",
          planCode: "FULL_SUITE",
          remainingDays: 30,
        },
      ];
      const mockCount = [{ count: 1 }];
      const mockSummary = [{ active: 1, expired: 0, trial: 0, cancelled: 0, suspended: 0 }];

      vi.mocked(prisma.$queryRaw).mockImplementation(async (sql: any) => {
        const sqlText = (sql.strings ? sql.strings.join(" ") : sql.text || "").toString();
        if (sqlText.includes("COUNT(CASE")) {
          return mockSummary;
        }
        if (sqlText.includes("COUNT(*)::integer")) {
          return mockCount;
        }
        return mockItems;
      });

      vi.mocked(prisma.companyModule.findMany).mockResolvedValue([
        { companyId: "comp-1", moduleCode: "PAYROLL" }
      ] as any);

      const listAllSubscriptions = (await import("../src/services/adminSubscription/listAllSubscriptions.service.js")).default;
      const res = await listAllSubscriptions({
        page: 1,
        pageSize: 10,
        search: "Auronox",
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].name).toBe("Auronox Corp");
      expect(res.items[0].modules).toEqual(["PAYROLL"]);
      expect(res.pagination.total).toBe(1);
      expect(res.summary.active).toBe(1);
    });

    it("should return correct expired subscription status on computed check", async () => {
      const mockItems = [
        {
          id: "comp-2",
          name: "Expired Company",
          email: "expired@co.com",
          createdAt: new Date(),
          subscriptionId: "sub-2",
          status: "EXPIRED",
          startDate: new Date(),
          endDate: new Date(Date.now() - 1000 * 60),
          currentPlan: "TDS Plan",
          planCode: "TDS",
          remainingDays: 0,
        },
      ];
      const mockCount = [{ count: 1 }];
      const mockSummary = [{ active: 0, expired: 1, trial: 0, cancelled: 0, suspended: 0 }];

      vi.mocked(prisma.$queryRaw).mockImplementation(async (sql: any) => {
        const sqlText = (sql.strings ? sql.strings.join(" ") : sql.text || "").toString();
        if (sqlText.includes("COUNT(CASE")) {
          return mockSummary;
        }
        if (sqlText.includes("COUNT(*)::integer")) {
          return mockCount;
        }
        return mockItems;
      });

      vi.mocked(prisma.companyModule.findMany).mockResolvedValue([]);

      const listAllSubscriptions = (await import("../src/services/adminSubscription/listAllSubscriptions.service.js")).default;
      const res = await listAllSubscriptions({
        page: 1,
        pageSize: 10,
        status: "EXPIRED",
        sortBy: "endDate",
        sortOrder: "desc",
      });

      expect(res.items[0].status).toBe("EXPIRED");
      expect(res.items[0].remainingDays).toBe(0);
      expect(res.summary.expired).toBe(1);
    });
  });

  describe("changePlanSubscription", () => {
    it("should successfully upgrade plan and preserve endDate", async () => {
      const changePlanSubscription = (await import("../src/services/adminSubscription/changePlanSubscription.service.js")).default;
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      vi.mocked(SUBSCRIPTION_REPO.getPlanByCode).mockResolvedValue({ id: "plan-fs-uuid", code: "FULL_SUITE", isActive: true } as any);
      
      const mockActiveSub = {
        id: "active-sub-id",
        companyId,
        planId: "plan-tds-uuid",
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        isActive: true,
        status: "ACTIVE",
        plan: { id: "plan-tds-uuid", code: "TDS" }
      };
      vi.mocked(SUBSCRIPTION_REPO.getActiveSubscription).mockResolvedValue(mockActiveSub as any);
      
      const mockNewSub = { id: "new-sub-id", companyId, planId: "plan-fs-uuid", plan: { code: "FULL_SUITE" }, isActive: true, status: "ACTIVE" };
      vi.mocked(prisma.companySubscription.findFirst).mockResolvedValue(mockNewSub as any);

      const res = await changePlanSubscription(adminUserId, {
        companyId,
        planCode: "FULL_SUITE",
        reason: "Client upgrade request",
      });

      expect(res).toEqual(mockNewSub);
      expect(subscribeCompany).toHaveBeenCalledWith(
        companyId,
        expect.objectContaining({
          planCode: "FULL_SUITE",
          endDate: mockActiveSub.endDate,
        }),
        expect.any(Object),
      );
    });
  });

  describe("suspendSubscription", () => {
    it("should deactivate active subscription and update status to SUSPENDED", async () => {
      const suspendSubscription = (await import("../src/services/adminSubscription/suspendSubscription.service.js")).default;
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      const mockActiveSub = {
        id: "sub-to-suspend",
        companyId,
        planId: "plan-tds-uuid",
        isActive: true,
        status: "ACTIVE",
        plan: { code: "TDS" }
      };
      vi.mocked(SUBSCRIPTION_REPO.getActiveSubscription).mockResolvedValue(mockActiveSub as any);
      vi.mocked(prisma.companySubscription.update).mockResolvedValue({ ...mockActiveSub, isActive: false, status: "SUSPENDED" } as any);

      const res = await suspendSubscription(adminUserId, {
        companyId,
        reason: "Delinquent payment hold",
      });

      expect(res.status).toBe("SUSPENDED");
      expect(res.isActive).toBe(false);
    });
  });

  describe("reactivateSubscription", () => {
    it("should reactivate a suspended subscription", async () => {
      const reactivateSubscription = (await import("../src/services/adminSubscription/reactivateSubscription.service.js")).default;
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      
      const mockSuspendedSub = {
        id: "suspended-sub",
        companyId,
        planId: "plan-tds-uuid",
        isActive: false,
        status: "SUSPENDED",
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days in future
        plan: { code: "TDS" }
      };
      vi.mocked(prisma.companySubscription.findFirst).mockResolvedValue(mockSuspendedSub as any);
      vi.mocked(prisma.companySubscription.update).mockResolvedValue({ ...mockSuspendedSub, isActive: true, status: "ACTIVE" } as any);

      const res = await reactivateSubscription(adminUserId, { companyId });

      expect(res.status).toBe("ACTIVE");
      expect(res.isActive).toBe(true);
    });
  });

  describe("getExpiringSubscriptions", () => {
    it("should retrieve list of subscriptions expiring within N days", async () => {
      const getExpiringSubscriptions = (await import("../src/services/adminSubscription/getExpiringSubscriptions.service.js")).default;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 5);

      const mockExpiringRecord = {
        id: "sub-expiring",
        companyId,
        startDate: new Date(),
        endDate: expiryDate,
        status: "ACTIVE",
        isActive: true,
        company: { id: companyId, name: "Acme Corp", email: "info@acme.com" },
        plan: { id: "p-1", code: "TDS", name: "TDS Plan" }
      };
      vi.mocked(prisma.companySubscription.findMany).mockResolvedValue([mockExpiringRecord] as any);

      const res = await getExpiringSubscriptions(30);

      expect(res).toHaveLength(1);
      expect(res[0].companyName).toBe("Acme Corp");
      expect(res[0].planCode).toBe("TDS");
      expect(res[0].remainingDays).toBeLessThanOrEqual(5);
    });
  });
});
