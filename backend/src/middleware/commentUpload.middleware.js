import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
export const commentUploadsDirectory = path.resolve(
  currentDirectory,
  "../../uploads/comments",
);

fs.mkdirSync(commentUploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, commentUploadsDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

export const uploadCommentAttachments = multer({
  storage,
  limits: {
    files: 10,
    fileSize: 15 * 1024 * 1024,
  },
});
