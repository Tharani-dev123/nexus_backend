// Usage: node upload.mjs "<PRESIGNED_URL>" "./path/to/file.xlsx"
import { readFile } from "node:fs/promises";

let uploadUrl = "https://auronox.s3.ap-south-1.amazonaws.com/payroll/7e1543e9-3984-4e44-acc6-57935717ce94/20260619/5c4d0b80-4ac5-4e12-b751-95f7fe527065.xls?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4A3QLMTDMCYCYCFO%2F20260619%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260619T034842Z&X-Amz-Expires=300&X-Amz-Signature=af0126b87050244038faf7a90e72b71999d10dc2d5351c10fec3e543bb20041a&X-Amz-SignedHeaders=host&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=PutObject";
let filePath = "./Salary Statement sample.xlsx";
if (!uploadUrl || !filePath) {
  console.error('Usage: node upload.mjs "<PRESIGNED_URL>" "<FILE_PATH>"');
  process.exit(1);
}

const CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const body = await readFile(filePath); // read as raw bytes

const res = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": CONTENT_TYPE }, // must match the signed ContentType
  body,
});

const text = await res.text();

if (res.ok) {
  console.log(`✅ Upload succeeded (${res.status})`);
  console.log("ETag:", res.headers.get("etag"));
} else {
  console.error(`❌ Upload failed (${res.status})`);
  console.error(text);
  process.exit(1);
}
