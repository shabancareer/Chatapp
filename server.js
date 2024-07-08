import express from "express";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cookieSession from "cookie-session";
import passport from "passport";
import path from "path";
import userRoute from "./routes/userRoute.js";
// import { fileURLToPath } from "url";
dotenv.config();
const app = express();
app.use(express.json());

// Use JSON middleware to parse JSON bodies
app.use(express.json());
//Home page Route
app.get("/", (req, res) => {
  res.send("API Running!..");
});
console.log(userRoute);
app.use("/api/", userRoute);

// Get the directory name and file name
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const url = `http://localhost:${PORT}`;
app.listen(PORT, () => {
  console.log(`Server is running on \x1b[34m${url}\x1b[0m`);
});
