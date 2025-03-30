import { Router } from "express";
import{
    subscribe
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/subscribe").post(verifyJWT,subscribe)

export default router;