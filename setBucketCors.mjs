// One-shot: apply a CORS policy to the S3 bucket so the browser can PUT files
// to presigned URLs. Node (e.g. upload.mjs) doesn't do CORS preflight, but the
// browser sends an OPTIONS preflight before every cross-origin PUT — without this
// policy S3 answers that preflight with 403 and the upload never starts.
//
// Run once (re-run any time you add a new frontend origin):
//   node setBucketCors.mjs
//
// Reads AWS_REGION, S3_BUCKET, FCX_AWS_ACCESS_KEY, FCX_AWS_ACCESS_KEY_SECRET
// from .env (same vars the backend already uses).
import { config } from "dotenv";
import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";

config({ path: ".env" });

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = (process.env.S3_BUCKET || "").trim();

if (!BUCKET) {
  console.error("Missing S3_BUCKET in .env");
  process.exit(1);
}

// Origins allowed to PUT/GET directly against S3. Add your deployed frontend
// origin(s) here (no trailing slash, scheme included).
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.FCX_AWS_ACCESS_KEY,
    secretAccessKey: process.env.FCX_AWS_ACCESS_KEY_SECRET,
  },
});

const CORSRules = [
  {
    AllowedHeaders: ["*"], // lets the preflight approve Content-Type + x-amz-* headers
    AllowedMethods: ["PUT", "GET", "HEAD"],
    AllowedOrigins: ALLOWED_ORIGINS,
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3000,
  },
];

try {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: { CORSRules },
    }),
  );
  console.log(`✅ CORS applied to bucket "${BUCKET}" (${REGION})`);
  console.log("   Allowed origins:", ALLOWED_ORIGINS.join(", "));

  // Read it back so you can confirm what S3 now has.
  const current = await s3.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
  console.log("   Current CORSRules:", JSON.stringify(current.CORSRules, null, 2));
} catch (err) {
  console.error(`❌ Failed to set CORS on "${BUCKET}":`, err?.message || err);
  process.exit(1);
}
