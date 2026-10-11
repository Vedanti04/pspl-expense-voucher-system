import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import voucherRoutes from "./src/routes/voucherRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(path.join(uploadsDir, "signatures"), { recursive: true });

// CORS configuration
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: [allowedOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Static serving for uploaded signatures
app.use("/uploads", express.static(uploadsDir));

// API routes
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "PSPL Expense Voucher Management API"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/vouchers", voucherRoutes);

// Optional: Serve frontend static build in single-service production deployments
const frontendDist = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Global Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

export default app;

if (process.env.NODE_ENV !== "test") {
  initializeDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(` PSPL Expense Voucher System API running on port ${PORT}`);
        console.log(` Health check: http://localhost:${PORT}/api/health`);
        console.log(`====================================================`);
      });
    })
    .catch((err) => {
      console.error("FATAL: Failed to connect to MySQL database:", err.message);
      process.exit(1);
    });
}