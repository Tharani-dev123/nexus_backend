import prisma from "../../database/index.db.js";
import { AppError } from "../../types/AppError.js";

export interface CreateWorkflowParams {
  module: string;
  entityId: string;
  companyId: string;
  stages: string[]; // e.g. ["MANAGER", "HR", "PAYROLL", "FINANCE"]
}

export async function createWorkflowInstance(params: CreateWorkflowParams) {
  const { module, entityId, companyId, stages } = params;

  return await prisma.$transaction(async (tx) => {
    // Delete any existing workflow instances for this entity
    const existing = await tx.workflowInstance.findFirst({
      where: { module, entityId, companyId },
    });
    if (existing) {
      await tx.workflowInstance.delete({ where: { id: existing.id } });
    }

    const instance = await tx.workflowInstance.create({
      data: {
        module,
        entityId,
        companyId,
        status: "PENDING",
        currentStage: stages[0] || "APPROVED",
      },
    });

    if (stages.length === 0) {
      await tx.workflowInstance.update({
        where: { id: instance.id },
        data: { status: "APPROVED", currentStage: "APPROVED" },
      });
      return instance;
    }

    const stepsData = stages.map((stage, idx) => ({
      instanceId: instance.id,
      stage,
      sequence: idx + 1,
      action: "PENDING",
    }));

    await tx.workflowStep.createMany({
      data: stepsData,
    });

    return instance;
  });
}

export async function submitWorkflowReview(params: {
  module: string;
  entityId: string;
  companyId: string;
  approverId: string;
  action: "APPROVED" | "REJECTED";
  note?: string;
}) {
  const { module, entityId, companyId, approverId, action, note } = params;

  return await prisma.$transaction(async (tx) => {
    const instance = await tx.workflowInstance.findFirst({
      where: { module, entityId, companyId, status: "PENDING" },
      include: { steps: { orderBy: { sequence: "asc" } } },
    });

    if (!instance) {
      throw new AppError("No pending workflow instance found for this request", 404);
    }

    const pendingStep = instance.steps.find((s) => s.action === "PENDING");
    if (!pendingStep) {
      throw new AppError("No pending approval step in current workflow instance", 400);
    }

    // Update current step
    await tx.workflowStep.update({
      where: { id: pendingStep.id },
      data: {
        action,
        approverId,
        note: note || null,
        actedAt: new Date(),
      },
    });

    if (action === "REJECTED") {
      // Reject whole instance
      const updated = await tx.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: "REJECTED",
          currentStage: "REJECTED",
        },
      });
      return { instance: updated, finalized: true, approved: false };
    }

    // Find next pending step
    const nextStep = instance.steps.find((s) => s.sequence === pendingStep.sequence + 1);

    if (nextStep) {
      const updated = await tx.workflowInstance.update({
        where: { id: instance.id },
        data: {
          currentStage: nextStep.stage,
        },
      });
      return { instance: updated, finalized: false, approved: false };
    } else {
      // All steps approved
      const updated = await tx.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: "APPROVED",
          currentStage: "APPROVED",
        },
      });
      return { instance: updated, finalized: true, approved: true };
    }
  });
}
