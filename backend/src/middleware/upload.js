import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname).toLowerCase()}`)
});
function imageOnly(_req, file, cb) {
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  cb(allowed.includes(file.mimetype) ? null : new Error("Upload a PNG, JPG, or WEBP image"), allowed.includes(file.mimetype));
}
export const upload = multer({ storage, fileFilter: imageOnly, limits: { fileSize: 2 * 1024 * 1024 } });
