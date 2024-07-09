import { Router } from "express";
import { singUp } from "../controllers/userController.js";

const router = Router();
router.post("/singUp", singUp);

// router.get("/user", (req, res) => {
//   console.log("Received a GET request to /user");
//   res.send("GET request received");
// });

export default router;
