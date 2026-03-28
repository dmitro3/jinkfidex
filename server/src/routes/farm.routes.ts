import { Router } from "express";
import { listFarms } from "../controllers/farm.controller";

const router = Router();

router.get("/", listFarms);

export default router;
