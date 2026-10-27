import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import s3Client, {
  S3_BUCKET_NAME,
} from "../../../config/aws/s3.config.js";

interface GetUploadPresignedUrlInput {
  key: string;
  contentType?: string;
  expiresIn?: number;
}

export default async function getUploadPresignedUrl({
  key,
  contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  expiresIn = 60 * 5,
}: GetUploadPresignedUrlInput) {
  const bucket = S3_BUCKET_NAME("S3_BUCKET");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(
    s3Client,
    command,
    { expiresIn },
  );

  return {
    uploadUrl,
    key,
  };
}