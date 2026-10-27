import { EmailVariableValue } from "../../types/email.types.js";

export function renderTemplateContent(
  content: string | undefined,
  variables: Record<string, EmailVariableValue>,
) {
  if (!content) return undefined;

  return content.replace(
    /\{\{\s*([^}\s]+)\s*\}\}/g,
    (_, variableName: string) => {
      const value = variables[variableName];

      return value == null ? "" : String(value);
    },
  );
}
