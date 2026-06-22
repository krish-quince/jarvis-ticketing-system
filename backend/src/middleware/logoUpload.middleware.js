import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const logoUploadsDirectory = path.resolve(currentDirectory, "../../uploads/logos");

fs.mkdirSync(logoUploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, logoUploadsDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

export const uploadLogo = multer({
  storage,
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
});
