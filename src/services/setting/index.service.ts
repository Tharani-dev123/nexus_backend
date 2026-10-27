import prisma from "../../database/index.db.js";
import AUDIT_SERVICE from "../audit/index.service.js";

export interface UpdateSettingsInput {
  attendance?: any;
  tax?: any;
  email?: any;
  notification?: any;
}

export async function getCompanySettings(companyId: string) {
  let settings = await prisma.systemSetting.findUnique({
    where: { companyId },
  });

  if (!settings) {
    // Initialize defaults
    settings = await prisma.systemSetting.create({
      data: {
        companyId,
        attendance: {
          graceMinutes: 15,
          lockDayOfMonth: 5,
        },
        tax: {
          defaultRegime: "NEW",
        },
        email: {
          senderName: "HRMS System",
        },
        notification: {
          channels: ["EMAIL", "IN_APP"],
        },
      },
    });
  }

  return settings;
}

export async function updateCompanySettings(companyId: string, input: UpdateSettingsInput) {
  const current = await getCompanySettings(companyId);

  const updatedData: any = {};
  if (input.attendance !== undefined) updatedData.attendance = { ...(current.attendance as any), ...input.attendance };
  if (input.tax !== undefined) updatedData.tax = { ...(current.tax as any), ...input.tax };
  if (input.email !== undefined) updatedData.email = { ...(current.email as any), ...input.email };
  if (input.notification !== undefined) updatedData.notification = { ...(current.notification as any), ...input.notification };

  const updated = await prisma.systemSetting.update({
    where: { companyId },
    data: updatedData,
  });

  await AUDIT_SERVICE.recordAudit({
    action: "UPDATED",
    entityType: "SYSTEM_SETTING",
    entityId: updated.id,
    oldValue: current,
    newValue: updated,
  });

  return updated;
}
