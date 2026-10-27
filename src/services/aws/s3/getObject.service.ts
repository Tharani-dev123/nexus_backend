import { GetObjectCommand } from "@aws-sdk/client-s3";

import s3Client, {
  S3_BUCKET_NAME,
} from "../../../config/aws/s3.config.js";

import { AppError } from "../../../types/AppError.js";

export default async function getObject(
  key: string,
  bucket: string = S3_BUCKET_NAME("S3_BUCKET"),
): Promise<Buffer> {
  if (!key) {
    throw new AppError("S3 object key is required", 400);
  }

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new AppError(
      `S3 object "${key}" has no body`,
      404,
    );
  }

  const bytes = await response.Body.transformToByteArray();

  return Buffer.from(bytes);
}