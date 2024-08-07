import { Router } from "express";
import { requireAuthentication } from "../controllers/utils/middlewares/authCheck.js";
import { accessChat } from "../controllers/chatController.js";

const router = Router();
router.post("/chats", requireAuthentication, accessChat);

export default router;
