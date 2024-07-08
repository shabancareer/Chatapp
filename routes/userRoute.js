import { Router } from "express";
const router = Router();
// Define GET route for /user
router.get("/user", (req, res) => {
  console.log("Received a GET request to /user");
  res.send("GET request received");
});

export default router;
