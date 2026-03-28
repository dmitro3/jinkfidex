import { Router } from "express";
import {
  submitStaking, listStakingSubmissions, myStakingSubmissions,
  approveStakingSubmission, rejectStakingSubmission,
} from "../controllers/staking.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/submit",              requireAuth,  submitStaking);
router.get("/submissions/mine",     requireAuth,  myStakingSubmissions);
router.get("/submissions",          requireAdmin, listStakingSubmissions);
router.post("/submissions/:id/approve", requireAdmin, approveStakingSubmission);
router.post("/submissions/:id/reject",  requireAdmin, rejectStakingSubmission);

export default router;
