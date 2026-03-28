import { Router } from "express";
import { getNonce, verifySignature, getMe } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/nonce/:address", getNonce);
router.post("/verify", verifySignature);
router.get("/me", requireAuth, getMe);

export default router;
