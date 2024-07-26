import prisma from "../DB/db.config.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
// import authValidators from "./utils/validators/index.js";
import { sendEmail } from "../services/email/sendEmail.js";
import AuthorizationError from "./utils/config/errors/AuthorizationError.js";
import CustomError from "./utils/config/errors/CustomError.js";
import { generateToken } from "./utils/generateToken.js";

const ACCESS_TOKEN = {
  access: process.env.AUTH_ACCESS_TOKEN_SECRET,
  expiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRY,
};

const REFRESH_TOKEN = {
  refresh: process.env.AUTH_REFRESH_TOKEN_SECRET,
  secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
};
const RESET_PASSWORD_TOKEN = {
  expiry: process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS,
};

export const singUp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
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
    // console.log(errors);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }
    const { email, password } = req.body;
    const userLogin = await prisma.user.findUnique({
      where: { email },
    });
    // console.log(userLogin);
    if (!userLogin) {
      throw new Error(
        "E-mail Cannot find user with these credentials. Please singUp first"
      );
    }
    const isMatch = await bcrypt.compare(password, userLogin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const userLoginTokens = await generateToken(userLogin, res);
    const { accessToken, refreshToken } = userLoginTokens;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    return res.status(201).json({
      success: true,
      data: userLogin,
      accessToken,
      msg: "User login.",
    });
  } catch (error) {
    next(error);
  } finally {
    await prisma.$disconnect();
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AuthorizationError(
        "Authentication Error",
        undefined,
        "User is not authenticated"
      );
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new CustomError(
        "User Not Found",
        404,
        "Cannot find user with the provided ID"
      );
    }
    const cookies = req.cookies;
    const refreshToken = cookies["refreshToken"];
    if (!refreshToken) {
      throw new AuthorizationError(
        "Token Error",
        undefined,
        "Refresh token is missing"
      );
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    return res.status(200).json({
      success: true,
      msg: "User Logout...!",
    });
  } catch (error) {
    console.log(error);
    next(error);
  } finally {
    await prisma.$disconnect();
  }
};

export const logoutAllDevices = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const cookies = req.cookies;
    const userRefreshToken = cookies["refreshToken"];
    if (!userRefreshToken) {
      return res.status(400).json({
        success: false,
        message: "No refresh token found",
      });
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    return res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    next(error);
  } finally {
    await prisma.$disconnect();
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    const authHeader = req.header("Authorization");
    // console.log(cookies.refreshToken);
    if (!cookies.refreshToken) {
      throw new AuthorizationError(
        "Authentication error!",
        "You are unauthenticated",
        {
          realm: "reauth",
          error: "no_rft",
          error_description: "Refresh Token is missing!",
        }
      );
    }
    // console.log(authHeader);
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthorizationError(
        "Authentication Error",
        "You are unauthenticated!",
        {
          realm: "reauth",
          error: "invalid_access_token",
          error_description: "access token error",
        }
      );
    }

    const rfTkn = cookies.refreshToken;
    const decodedRefreshTkn = jwt.verify(rfTkn, REFRESH_TOKEN.refresh);
    const userId = decodedRefreshTkn._id;
    console.log(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    // console.log(user);
    if (!user) {
      throw new AuthorizationError(
        "Authentication Error",
        "You are unauthenticated!",
        {
          realm: "reauth",
        }
      );
    }
    console.log(
      "Removing stale access token from cookies in refresh handler..."
    );

    const newAccessToken = await generateToken(user.id, user.email, res);
    const newRefreshToken = await generateToken(user.id, user.email, res);
    // Generate new tokens
    // console.log("NewAccessToken:-", newAccessToken);
    // console.log("NewRefreshToken:-", newAccessToken);
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      msg: "Tokens refreshed successfully.",
    });
  } catch (error) {
    next(error);
  } finally {
    await prisma.$disconnect();
  }
};
