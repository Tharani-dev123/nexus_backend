import prisma from "../../database/index.db.js";
import sendEmail from "../aws/email/sendEmail.service.js";
import logger from "../../config/logging/logger.config.js";

export async function processQueue() {
  const now = new Date();
  const pendingJobs = await prisma.notificationQueue.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: 3 },
      scheduledAt: { lte: now },
    },
    take: 50,
    orderBy: { scheduledAt: "asc" },
  });

  if (pendingJobs.length === 0) return;

  logger.info(`Notification worker: processing ${pendingJobs.length} notifications...`);

  for (const job of pendingJobs) {
    // Atomically set processing state
    await prisma.notificationQueue.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });

    const payload = job.payload as any;
    let success = false;
    let errorMsg: string | null = null;

    try {
      switch (job.channel) {
        case "EMAIL":
          await sendEmail({
            to: [job.recipient],
            subject: payload.subject || "Notification",
            html: payload.body,
            text: payload.body.replace(/<[^>]*>/g, ""),
            attachments: payload.attachments,
          });
          success = true;
          break;

        case "IN_APP":
          await prisma.inAppNotification.create({
            data: {
              userId: job.recipient,
              title: payload.title || "Notification",
              body: payload.body,
              isRead: false,
            },
          });
          success = true;
          break;

        case "SMS":
        case "WHATSAPP":
        case "PUSH":
          // Mock delivery for external channels
          logger.info(`Mock notification delivered via ${job.channel} to ${job.recipient}`);
          success = true;
          break;

        default:
          throw new Error(`Unsupported channel: ${job.channel}`);
      }
    } catch (err) {
      errorMsg = (err as Error).message;
      logger.error(`Failed to send notification ${job.id}: ${errorMsg}`);
    }

    if (success) {
      await prisma.notificationQueue.update({
        where: { id: job.id },
        data: {
          status: "SENT",
          attempts: job.attempts + 1,
          sentAt: new Date(),
        },
      });
    } else {
      const nextAttemptFailed = job.attempts + 1 >= 3;
      await prisma.notificationQueue.update({
        where: { id: job.id },
        data: {
          status: nextAttemptFailed ? "FAILED" : "PENDING",
          attempts: job.attempts + 1,
          errorLog: errorMsg,
        },
      });
    }
  }
}
