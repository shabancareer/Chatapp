import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// Import your database connection function
// import connectDB from './path/to/connectDB.js';

// Load environment variables from .env file
dotenv.config();

// Connect to the database
// connectDB(); // Uncomment and use the correct path to your connectDB function

const app = express();

// Use JSON middleware to parse JSON bodies
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("API Running!");
});

// Get the directory name and file name
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
