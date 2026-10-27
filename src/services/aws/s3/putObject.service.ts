import { PutObjectCommand } from "@aws-sdk/client-s3";

import s3Client, {
  S3_BUCKET_NAME,
} from "../../../config/aws/s3.config.js";

import { AppError } from "../../../types/AppError.js";

interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType?: string;
  bucket?: string;
}

// Server-side upload of a buffer to S3. Used by the payroll upload proxy so the
// file PUT happens in Node (like upload.mjs) instead of cross-origin from the
// browser, which a presigned-URL PUT would require (and which S3 CORS blocks).
export default async function putObject({
  key,
  body,
  contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  bucket = S3_BUCKET_NAME("S3_BUCKET"),
}: PutObjectInput): Promise<{ key: string }> {
  if (!key) {
    throw new AppError("S3 object key is required", 400);
  }
  if (!body || body.length === 0) {
    throw new AppError("File is empty", 400);
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { key };
}
