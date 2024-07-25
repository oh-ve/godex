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
        console.log("Fetching Pokémon for user ID:", userId); // Add this log
        const result = yield pool.query("SELECT id, user_id, name, nickname, is_shiny, iv, date, ST_AsText(location) as location, distance FROM pokemon WHERE user_id = $1", [userId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.get("/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield pool.query("SELECT * FROM pokemon WHERE id = $1", [
            id,
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pokémon not found" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.post("/", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, name, nickname, is_shiny, iv, date, location } = req.body;
    try {
        // Calculate the distance from user's home location
        const distanceResult = yield pool.query("SELECT ST_Distance(ST_GeomFromText($1, 4326), home) / 1000 as distance FROM users WHERE id = $2", [location, user_id]);
        const distance = distanceResult.rows[0].distance;
        const result = yield pool.query("INSERT INTO pokemon (user_id, name, nickname, is_shiny, iv, date, location, distance) VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), $8) RETURNING *", [user_id, name, nickname, is_shiny, iv, date, location, distance]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.put("/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, nickname, is_shiny, iv, date, location, distance } = req.body;
    try {
        const result = yield pool.query("UPDATE pokemon SET name = $1, nickname = $2, is_shiny = $3, iv = $4, date = $5, location = ST_GeogFromText($6), distance = $7 WHERE id = $8 RETURNING *", [name, nickname, is_shiny, iv, date, location, distance, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pokémon not found" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.delete("/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield pool.query("DELETE FROM pokemon WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pokémon not found" });
        }
        res.json({ message: "Pokémon deleted successfully" });
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.delete("/", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield pool.query("DELETE FROM pokemon");
        res.json({ message: "All Pokémon deleted successfully" });
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
exports.default = router;
