import { Router } from "express";
import { singUp, login } from "../controllers/userController.js";

const router = Router();
router.post("/singUp", singUp);
router.post("/login", login);

// router.get("/user", (req, res) => {
//   console.log("Received a GET request to /user");
//   res.send("GET request received");
// });

export default router;
