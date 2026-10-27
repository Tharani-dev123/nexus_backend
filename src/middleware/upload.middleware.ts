import multer from "multer";
import { AppError } from "../types/AppError.js";

const ALLOWED_EXTENSIONS = /\.(xlsx|xls|csv)$/i;
const ALLOWED_MIMETYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "application/octet-stream", // some clients send this for .xlsx
]);

/**
 * In-memory single-file upload for spreadsheet imports. The buffer is handed to
 * the parser directly (no disk/S3 round-trip). Field name: `file`.
 */
const spreadsheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_EXTENSIONS.test(file.originalname) && !ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(new AppError("Only .xlsx, .xls or .csv files are accepted", 400));
      return;
    }
    cb(null, true);
  },
});

/** Accepts one spreadsheet in the `file` field. */
export const uploadSpreadsheet = spreadsheetUpload.single("file");

