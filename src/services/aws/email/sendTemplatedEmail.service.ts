import sendEmail from "./sendEmail.service.js";

import { renderTemplateContent } from "../../../utils/email/renderTemplaceContent.util.js";
import {
  EmailTemplateDefinition,
  EmailTemplateVariables,
  SesEmailAttachment,
} from "../../../types/email.types.js";

export default async function sendTemplatedEmail<
  TTemplate extends EmailTemplateDefinition,
>({
  to,
  template,
  variables,
  cc,
  replyTo,
  attachments,
}: {
  to: string[];
  template: TTemplate;
  variables: EmailTemplateVariables<TTemplate>;
  cc?: string[];
  replyTo?: string[];
  attachments?: SesEmailAttachment[];
}) {
  await sendEmail({
    to,
    subject: renderTemplateContent(template.subject, variables) ?? "",
    text: renderTemplateContent(template.text, variables),
    html: renderTemplateContent(template.html, variables),
    cc: cc,
    replyTo: replyTo,
    attachments: attachments,
  });
}
