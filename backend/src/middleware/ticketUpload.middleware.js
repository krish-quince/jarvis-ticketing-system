import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const ticketUploadsDirectory = path.resolve(currentDirectory, "../../uploads/tickets");

fs.mkdirSync(ticketUploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, ticketUploadsDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

export const uploadTicketAttachments = multer({
  storage,
  limits: { files: 10, fileSize: 15 * 1024 * 1024 },
});
