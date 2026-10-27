import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import SES_CLIENT, {
  TRANSACTIONAL_DOMAIN_EMAIL,
} from "../../../config/aws/ses.config.js";
import { SesEmailAttachment } from "../../../types/email.types.js";
import logger from "../../../config/logging/logger.config.js";
import nodemailer from "nodemailer";
import SOCIAL_MEDIA_ATTACHMENTS from "../../../constants/email/media/socialMediaAttachments.constant.js";
const streamToBuffer = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export default async function sendEmail({
  to,
  subject,
  text,
  html,
  cc,
  replyTo,
  attachments,
}: {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  replyTo?: string[];
  attachments?: SesEmailAttachment[];
}) {
  try {
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
    });

    const finalAttachments = attachments
      ? [...SOCIAL_MEDIA_ATTACHMENTS, ...attachments]
      : SOCIAL_MEDIA_ATTACHMENTS;

    const mailOptions = {
      from: TRANSACTIONAL_DOMAIN_EMAIL,
      to: to.join(","),
      cc: cc?.join(","),
      replyTo: replyTo?.join(","),
      subject,
      text,
      html,
      attachments: finalAttachments?.map((att) => ({
        filename: att.FileName,
        content: Buffer.from(att.RawContent),
        contentType: att.ContentType,
        cid: att.ContentId,
      })),
    };

    const info = await transporter.sendMail(mailOptions);

    const command = new SendEmailCommand({
      Content: {
        Raw: {
          Data: new Uint8Array(
            Buffer.isBuffer(info.message)
              ? info.message
              : await streamToBuffer(info.message),
          ),
        },
      },
    });

    await SES_CLIENT.send(command);
  } catch (err) {
    logger.error("Error Sending an email", err);
  }
}
