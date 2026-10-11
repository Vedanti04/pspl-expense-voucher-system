import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads/signatures");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `sig-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP signature images are allowed"), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter
});

/**
 * Utility to save base64 signature data (from canvas) as a file in uploads
 */
export function saveBase64Signature(base64Data, prefix = "sig") {
  if (!base64Data || typeof base64Data !== "string") return null;
  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;

  const ext = matches[1] === "jpeg" ? ".jpg" : `.${matches[1]}`;
  const buffer = Buffer.from(matches[2], "base64");
  const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const filepath = path.join(uploadDir, filename);

  fs.writeFileSync(filepath, buffer);
  return `/uploads/signatures/${filename}`;
}
