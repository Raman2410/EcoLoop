import dotenv from "dotenv";

dotenv.config({
  path: process.cwd() + "/.env",
});

// if (!process.env.POSTGRES_URL) {
//   throw new Error("❌ POSTGRES_URL not defined");
// }
