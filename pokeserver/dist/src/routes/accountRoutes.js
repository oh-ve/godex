"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
const auth_1 = require("../middleware/auth");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const router = (0, express_1.Router)();
router.get("/", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(400).json({ error: "User ID not found" });
        }
        const result = yield pool.query("SELECT id, account_name, avg_iv, num_shiny, num_hundos, num_shundos, is_main FROM accounts WHERE user_id = $1", [userId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.get("/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const result = yield pool.query("SELECT account_name FROM accounts WHERE id = $1 AND user_id = $2", [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.post("/", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { account_name, is_main } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!account_name || !userId) {
        return res
            .status(400)
            .json({ error: "Account name and User ID are required" });
    }
    try {
        if (is_main) {
            yield pool.query("UPDATE accounts SET is_main = FALSE WHERE user_id = $1", [userId]);
        }
        const result = yield pool.query("INSERT INTO accounts (user_id, account_name, is_main) VALUES ($1, $2, $3) RETURNING *", [userId, account_name, is_main]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.put("/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { account_name, is_main } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!account_name || !userId) {
        return res
            .status(400)
            .json({ error: "Account name and User ID are required" });
    }
    try {
        if (is_main) {
            yield pool.query("UPDATE accounts SET is_main = FALSE WHERE user_id = $1", [userId]);
        }
        const result = yield pool.query("UPDATE accounts SET account_name = $1, is_main = $2 WHERE id = $3 AND user_id = $4 RETURNING *", [account_name, is_main, id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.delete("/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const result = yield pool.query("DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING *", [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }
        res.json({ message: "Account deleted successfully" });
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.delete("/", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        yield pool.query("DELETE FROM accounts WHERE user_id = $1", [userId]);
        res.json({ message: "All accounts deleted successfully" });
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
exports.default = router;
