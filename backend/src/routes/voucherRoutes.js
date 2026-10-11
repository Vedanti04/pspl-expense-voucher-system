import { Router } from "express";
import {
  getVouchers,
  getDashboardStats,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  uploadEmployeeSignature,
  submitVoucher,
  approveVoucher,
  rejectVoucher
} from "../controllers/voucherController.js";
import { authenticate, allowRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

// All voucher endpoints require authentication
router.use(authenticate);

// Listing & Dashboard Stats
router.get("/", getVouchers);
router.get("/dashboard", getDashboardStats);
router.get("/:id", getVoucherById);

// Employee voucher creation & draft management
router.post("/", allowRoles("employee"), upload.single("signature"), createVoucher);
router.put("/:id", allowRoles("employee"), upload.single("signature"), updateVoucher);
router.delete("/:id", allowRoles("employee"), deleteVoucher);
router.post("/:id/employee-signature", allowRoles("employee"), upload.single("signature"), uploadEmployeeSignature);
router.post("/:id/submit", allowRoles("employee"), upload.single("signature"), submitVoucher);

// Director approval & rejection
router.post("/:id/approve", allowRoles("director"), upload.single("signature"), approveVoucher);
router.post("/:id/reject", allowRoles("director"), rejectVoucher);

export default router;
