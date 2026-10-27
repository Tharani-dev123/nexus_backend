import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client, { S3_BUCKET_NAME } from "../../../config/aws/s3.config.js";

/** Generates a read pre-signed URL for an S3 object key. Default expiry: 1 hour. */
export default async function getViewPresignedUrl(
  key: string,
  expiresInSeconds = 3600,
  bucket: string = S3_BUCKET_NAME("S3_BUCKET"),
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
