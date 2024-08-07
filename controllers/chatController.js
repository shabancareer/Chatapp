import { body } from "express-validator";
import prisma from "../DB/db.config.js";

export const accessChat = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    next();
  }
};
