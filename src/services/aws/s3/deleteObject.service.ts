import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import s3Client, {
  S3_BUCKET_NAME,
} from "../../../config/aws/s3.config.js";

export default async function deleteObject(
  key: string,
  bucket: string = S3_BUCKET_NAME("S3_BUCKET"),
): Promise<void> {
  if (!key) {
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}