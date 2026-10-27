import { S3Client } from "@aws-sdk/client-s3";

import AWS_CONFIG from "./aws.config.js";
import CONFIG from "../index.config.js";

const S3_CLIENT = new S3Client(AWS_CONFIG);

export const S3_BUCKET_NAME = CONFIG;

export default S3_CLIENT;