import dotenv from "dotenv";
import prisma from "../DB/db.config.js";
import bcrypt from "bcryptjs";
import { generateToken, refreshAccessToken } from "./utils/generateToken.js";

export const singUp = async (req, res) => {
  const { name, email, password, photo } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please Enter all the Fields");
    }
    const userExists = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (userExists) {
      res.status(400).json({
        status: 400,
        message: "Email already taken. Please use another email.",
      });
    }
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        photo,
      },
    });
    const token = await generateToken(newUser);
    console.log("Token:-", token);
    const refreshAccessToken = async (token) => {
      try {
        // Verify the provided refresh token
        const decoded = jwt.verify(
          token,
          process.env.AUTH_REFRESH_TOKEN_SECRET
        );

        // If token is valid, generate a new access token
        const accessToken = jwt.sign(
          { userId: decoded.userId },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );
        return Promise.resolve({ accessToken });
      } catch (err) {
        return Promise.reject(err);
      }
    };
    return res.status(200).json({
      status: 200,
      data: newUser,
      token: token,
      msg: "User created.",
    });
  } catch (error) {
    console.error("Error While SingUp new User:", error);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};
