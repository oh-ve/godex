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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const cors_1 = __importDefault(require("cors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const pokemonRoutes_1 = __importDefault(require("./src/routes/pokemonRoutes"));
const auth_1 = require("./src/middleware/auth");
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/api/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, home } = req.body;
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    try {
        const result = yield pool.query("INSERT INTO users (username, password, home) VALUES ($1, $2, ST_GeogFromText($3)) RETURNING *", [username, hashedPassword, home]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/api/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const result = yield pool.query("SELECT * FROM users WHERE username = $1", [
            username,
        ]);
        const user = result.rows[0];
        if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ accessToken });
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/api/update-home", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { home } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(400).json({ error: "User ID not found" });
    }
    try {
        const client = yield pool.connect();
        try {
            yield client.query("BEGIN");
            console.log("Received home:", home); // Debugging log
            // Adjusted regex pattern
            const match = home.match(/POINT\(([-.\d]+) ([-.\d]+)\)/);
            if (!match) {
                throw new Error("Invalid location format");
            }
            const [_, lon, lat] = match;
            console.log("Parsed coordinates:", lon, lat); // Debugging log
            // Update the user's home location
            yield client.query("UPDATE users SET home = ST_SetSRID(ST_Point($1, $2), 4326)::geography WHERE id = $3", [lon, lat, userId]);
            // Recalculate distances for all Pokémon of this user using ST_Distance
            yield client.query(`UPDATE pokemon
           SET distance = ST_Distance(location::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography) / 1000
           WHERE user_id = $3`, [lon, lat, userId]);
            yield client.query("COMMIT");
            res.json({
                message: "Home location updated and distances recalculated successfully!",
            });
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
app.get("/api/protected", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(400).json({ error: "User ID not found" });
    }
    try {
        console.log("Fetching details for user ID:", userId);
        const result = yield pool.query("SELECT id, username, ST_AsText(home) as home FROM users WHERE id = $1", [userId]);
        console.log("Query result:", result.rows);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const user = result.rows[0];
        res.json({ user });
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.get("/", (req, res) => {
    res.send("Welcome to the Pokémon API!");
});
app.get("/api/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield pool.query("SELECT * FROM users");
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/api/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, home } = req.body;
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    try {
        const result = yield pool.query("INSERT INTO users (username, password, home) VALUES ($1, $2, ST_GeogFromText($3)) RETURNING *", [username, hashedPassword, home]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("Error executing query:", err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.use("/api/pokemon", pokemonRoutes_1.default);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
