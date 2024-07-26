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
        console.log("Fetching Pokémon for user ID:", userId);
        const result = yield pool.query("SELECT id, user_id, name, nickname, is_shiny, iv, date, ST_AsText(location) as location, distance, account FROM pokemon WHERE user_id = $1", [userId]);
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
        const result = yield pool.query("SELECT id, user_id, name, nickname, is_shiny, iv, date, ST_AsText(location) as location, distance, account FROM pokemon WHERE id = $1", [id]);
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
    var _a;
    const { user_id, name, nickname, is_shiny, iv, date, location, account } = req.body;
    try {
        // Calculate the distance from user's home location
        const distanceResult = yield pool.query("SELECT ST_Distance(ST_GeomFromText($1, 4326), home) / 1000 as distance FROM users WHERE id = $2", [location, user_id]);
        const distance = ((_a = distanceResult.rows[0]) === null || _a === void 0 ? void 0 : _a.distance) || 0;
        const result = yield pool.query("INSERT INTO pokemon (user_id, name, nickname, is_shiny, iv, date, location, distance, account) VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), $8, $9) RETURNING *", [user_id, name, nickname, is_shiny, iv, date, location, distance, account]);
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
    const { name, nickname, is_shiny, iv, date, location, account } = req.body;
    try {
        const client = yield pool.connect();
        try {
            yield client.query("BEGIN");
            // Update the Pokémon details including the location
            const updateResult = yield client.query("UPDATE pokemon SET name = $1, nickname = $2, is_shiny = $3, iv = $4, date = $5, location = ST_GeomFromText($6, 4326), account = $7 WHERE id = $8 RETURNING *", [name, nickname, is_shiny, iv, date, location, account, id]);
            if (updateResult.rows.length === 0) {
                yield client.query("ROLLBACK");
                return res.status(404).json({ error: "Pokémon not found" });
            }
            const pokemon = updateResult.rows[0];
            // Recalculate the distance from the user's home location
            const distanceResult = yield client.query("SELECT ST_Distance(ST_GeomFromText($1, 4326)::geography, home::geography) / 1000 as distance FROM users WHERE id = $2", [location, pokemon.user_id]);
            const distance = ((_a = distanceResult.rows[0]) === null || _a === void 0 ? void 0 : _a.distance) || 0;
            // Update the distance in the Pokémon record
            yield client.query("UPDATE pokemon SET distance = $1 WHERE id = $2", [
                distance,
                id,
            ]);
            yield client.query("COMMIT");
            res.json(updateResult.rows[0]);
        }
        catch (err) {
            yield client.query("ROLLBACK");
            console.error("Error executing query:", err.stack);
            res.status(500).json({ error: "Internal Server Error" });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error("Error connecting to database:", err.stack);
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
