import { Router } from "express";
import {
  listQuests, getQuest, getLeaderboard,
  getUserProgress, verifyTask,
  submitQuest, listSubmissions, mySubmissions,
  approveSubmission, rejectSubmission,
} from "../controllers/quest.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// Public
router.get("/",    listQuests);
router.get("/:id", getQuest);
router.get("/:id/leaderboard", getLeaderboard);

// Auth required
router.get("/:id/progress",              requireAuth, getUserProgress);
router.post("/:id/tasks/:taskId/verify", requireAuth, verifyTask);
router.post("/submit",                   requireAuth, submitQuest);
router.get("/submissions/mine",          requireAuth, mySubmissions);

// Admin only
router.get("/submissions",                        requireAdmin, listSubmissions);
router.post("/submissions/:subId/approve",        requireAdmin, approveSubmission);
router.post("/submissions/:subId/reject",         requireAdmin, rejectSubmission);

export default router;
