import dotenv from "dotenv";
import prisma from "../DB/db.config.js";
import bcrypt from "bcryptjs";
// import { PrismaClient } from "@prisma/client";
import { generateToken } from "./utils/generateToken.js";
// const prisma = new PrismaClient();

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
      return res.status(400).json({
        success: false,
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
    const tokens = await generateToken(newUser, res);
    // console.log("Token:-", token);
    const { accessToken, refreshToken } = tokens;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    return res.status(201).json({
      success: true,
      data: newUser,
      accessToken,
      msg: "User created.",
    });
  } catch (error) {
    console.error("Error While SingUp new User:", error);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      res.status(400);
      throw new Error("Please Enter all the Fields");
    }
    const userLogin = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!userLogin) {
      return res.status(400).json({
        message: "Cannot find user with these credentials. Please singUp first",
      });
    }
    const isMatch = await bcrypt.compare(password, userLogin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    res.status(200).json({ message: "Login successful", userLogin });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};
