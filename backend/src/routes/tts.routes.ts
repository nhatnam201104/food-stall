import { Router } from "express";
import { ttsController } from "../controllers/tts.controller";
import { authenticate } from "../middleware/auth.middleware";
import { ttsLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

router.post("/preview", ttsLimiter, ttsController.preview);

export default router;
