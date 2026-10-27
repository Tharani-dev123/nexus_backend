import prisma from "../../database/index.db.js";

export interface EnqueueNotificationParams {
  channel: "EMAIL" | "PUSH" | "SMS" | "WHATSAPP" | "IN_APP";
  recipient: string; // email, phone, userId, or device token
  payload: {
    subject?: string;
    body: string;
    title?: string;
    attachments?: any[];
  };
  scheduledAt?: Date;
}

export async function enqueueNotification(params: EnqueueNotificationParams) {
  const { channel, recipient, payload, scheduledAt = new Date() } = params;

  return await prisma.notificationQueue.create({
    data: {
      channel,
      recipient,
      payload: payload as any,
      status: "PENDING",
      scheduledAt,
    },
  });
}
