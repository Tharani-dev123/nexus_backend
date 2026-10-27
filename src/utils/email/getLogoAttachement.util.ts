import fs from "fs/promises";
import path from "path";

export const getInlineAttachment = async (
  fileName: string,
  contentId: string,
  contentType: string = "image/png",
) => {
  const filePath = path.join(process.cwd(), "assets", fileName);

  const fileBuffer = await fs.readFile(filePath);

  return {
    RawContent: new Uint8Array(fileBuffer),
    FileName: fileName,
    ContentType: contentType,
    ContentDisposition: "INLINE" as const,
    ContentId: contentId,
  };
};
