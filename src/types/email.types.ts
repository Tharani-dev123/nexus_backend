export type EmailVariableValue = string | number | boolean | null | undefined;

export type EmailTemplateDefinition<
  TVariables extends readonly string[] = readonly string[],
> = {
  variables: TVariables;
  subject: string;
  text?: string;
  html?: string;
};

export type EmailTemplateVariables<TTemplate extends EmailTemplateDefinition> =
  {
    [TKey in TTemplate["variables"][number]]: EmailVariableValue;
  };

export type SesEmailAttachment = {
  RawContent: Uint8Array; // required
  FileName: string; // required
  ContentDisposition?: "ATTACHMENT" | "INLINE";
  ContentDescription?: string;
  ContentId?: string;
  ContentTransferEncoding?: "BASE64" | "QUOTED_PRINTABLE" | "SEVEN_BIT";
  ContentType?: string;
};
