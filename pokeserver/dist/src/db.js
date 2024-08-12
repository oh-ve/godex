"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const baseDir = process.env.NODE_ENV === "production"
    ? path_1.default.resolve(__dirname, "..")
    : path_1.default.resolve(__dirname, "../..");
const caPath = path_1.default.join(baseDir, "certs", "ca.pem");
console.log("Resolved CA Path:", caPath);
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_SSL === "true"
        ? {
            rejectUnauthorized: true,
            ca: fs_1.default
                .readFileSync(path_1.default.resolve(__dirname, "../certs/ca.pem"))
                .toString(),
        }
        : false,
});
exports.default = pool;
