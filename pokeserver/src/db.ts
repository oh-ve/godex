import path from "path";
import { Pool } from "pg";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const baseDir =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "..")
    : path.resolve(__dirname, "../..");

const caPath = path.join(baseDir, "certs", "ca.pem");
console.log("Resolved CA Path:", caPath);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: true,
          ca: fs
            .readFileSync(path.resolve(__dirname, "../certs/ca.pem"))
            .toString(),
        }
      : false,
});

export default pool;
