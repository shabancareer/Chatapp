import jwt from "jsonwebtoken";
import prisma from "../../DB/db.config.js";

export const generateToken = async (user) => {
  try {
    if (!user || !user.id) {
      throw new Error("Invalid user object or missing user ID");
    }
    const payload = { _id: user.id };
    const accessToken = jwt.sign(
      payload,
      process.env.AUTH_ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRY }
    );
    const refreshToken = jwt.sign(
      payload,
      process.env.AUTH_REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRY }
    );
    return Promise.resolve({ accessToken, refreshToken });
    // const expiresAt = new Date();
    // expiresAt.setDate(expiresAt.getDate() + 30);
  } catch (err) {
    return Promise.reject(err);
  } finally {
    await prisma.$disconnect();
  }
};
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify the provided refresh token
    const decoded = jwt.verify(
      refreshToken,
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
// export default { generateToken, refreshAccessToken };
