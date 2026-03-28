import { Router } from "express";
import authRoutes   from "./auth.routes";
import questRoutes  from "./quest.routes";
import poolRoutes   from "./pool.routes";
import farmRoutes   from "./farm.routes";
import lockRoutes   from "./lock.routes";
import stakingRoutes from "./staking.routes";
import perpsRoutes  from "./perps.routes";

const router = Router();

router.use("/auth",    authRoutes);
router.use("/quests",  questRoutes);
router.use("/pools",   poolRoutes);
router.use("/farms",   farmRoutes);
router.use("/locks",   lockRoutes);
router.use("/staking", stakingRoutes);
router.use("/perps",   perpsRoutes);

router.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
