import { Router } from "express";
import { listPools, getPool, upsertPool } from "../controllers/pool.controller";

const router = Router();

router.get("/", listPools);
router.get("/:address", getPool);
router.post("/", upsertPool);

export default router;
