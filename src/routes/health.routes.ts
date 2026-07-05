import { Router } from "express";
import { getHealth, getIntegrationHealth } from "../controllers/health.controller";

const router = Router();

router.get("/", getHealth);
router.get("/integrations", getIntegrationHealth);

export default router;
