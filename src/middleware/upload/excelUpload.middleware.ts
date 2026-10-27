import multer from "multer";

/**
 * In-memory Excel upload (5MB cap). Mount as `excelUpload.single("file")`.
 * Multer errors (size / unexpected field) are translated by the global error
 * handler.
 */
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const ok =
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      file.mimetype.includes("spreadsheet") ||
      file.mimetype.includes("excel");
    if (ok) cb(null, true);
    else cb(new Error("Only Excel (.xlsx/.xls) files are supported"));
  },
});

export default excelUpload;
