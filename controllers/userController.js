import prisma from "../DB/db.config.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
// import authValidators from "./utils/validators/index.js";
import { sendEmail } from "../services/email/sendEmail.js";
import AuthorizationError from "./utils/config/errors/AuthorizationError.js";
import CustomError from "./utils/config/errors/CustomError.js";
import { generateToken } from "./utils/generateToken.js";

const RESET_PASSWORD_TOKEN = {
  expiry: process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS,
};

export const singUp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }
    const { name, email, password, photo } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

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
    next(error);
  } finally {
    await prisma.$disconnect();
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }
    const { email, password } = req.body;
  } catch (error) {}
  // const { email, password } = req.body;
  // try {
  //   if (!email || !password) {
  //     res.status(400);
  //     throw new Error("Please Enter all the Fields");
  //   }
  //   const userLogin = await prisma.user.findUnique({
  //     where: {
  //       email: email,
  //     },
  //   });
  //   if (!userLogin) {
  //     return res.status(400).json({
  //       message: "Cannot find user with these credentials. Please singUp first",
  //     });
  //   }
  //   const isMatch = await bcrypt.compare(password, userLogin.password);
  //   if (!isMatch) {
  //     return res.status(400).json({ message: "Invalid credentials" });
  //   }
  //   const userLoginTokens = await generateToken(userLogin);
  //   const { accessToken, refreshToken } = userLoginTokens;
  //   res.cookie("refreshToken", refreshToken, {
  //     httpOnly: true,
  //     sameSite: "None",
  //     secure: true,
  //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  //   });
  //   return res.status(200).json({
  //     success: true,
  //     data: userLogin,
  //     accessToken,
  //     msg: "Login successful",
  //   });
  // } catch (error) {
  //   console.error("Error during login:", error);
  //   res.status(500).json({ message: "Internal server error" });
  // } finally {
  //   await prisma.$disconnect();
  // }
};
