import express from "express";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import cookieSession from "cookie-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import path from "path";
import userRoute from "./routes/userRoute.js";
import chatRoute from "./routes/chatRoute.js";
import CustomError from "./controllers/utils/config/errors/CustomError.js";

// import { fileURLToPath } from "url";
dotenv.config();
const app = express();
app.use(cookieParser());

// Use JSON middleware to parse JSON bodies
app.use(express.json());
//Home page Route
app.get("/", (req, res) => {
  res.send("API Running!..");
});

app.use("/api/", userRoute);
app.use("/api/", chatRoute);
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof CustomError) {
    return res
      .status(err.status)
      .json({ message: err.feedback, errors: err.cause });
  }
  return res.status(500).json({ message: "Internal Server Error" });
});

// Get the directory name and file name
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const url = `http://localhost:${PORT}`;
app.listen(PORT, () => {
  console.log(`Server is running on \x1b[34m${url}\x1b[0m`);
});
