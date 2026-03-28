import { Router } from "express";
import { listLocks, getLock, createLock, markWithdrawn } from "../controllers/lock.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", listLocks);
router.get("/:id", getLock);
router.post("/", requireAuth, createLock);
router.patch("/:id/withdraw", requireAuth, markWithdrawn);

export default router;
