import { Router } from "express";
import {
  submitPerps, listPerpsSubmissions, myPerpsSubmissions,
  approvePerpsSubmission, rejectPerpsSubmission,
} from "../controllers/perps.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/submit",                 requireAuth,  submitPerps);
router.get("/submissions/mine",        requireAuth,  myPerpsSubmissions);
router.get("/submissions",             requireAdmin, listPerpsSubmissions);
router.post("/submissions/:id/approve", requireAdmin, approvePerpsSubmission);
router.post("/submissions/:id/reject",  requireAdmin, rejectPerpsSubmission);

export default router;
