"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const pokemonRoutes_1 = __importDefault(require("./src/routes/pokemonRoutes"));
const accountRoutes_1 = __importDefault(require("./src/routes/accountRoutes"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const db_1 = __importDefault(require("./src/db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", userRoutes_1.default);
app.use("/api/accounts", accountRoutes_1.default);
app.use("/api/pokemon", pokemonRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Welcome to the Pokémon API!");
});
db_1.default.connect((err) => {
    if (err) {
        console.error("Error connecting to the database", err);
    }
    else {
        console.log("Connected to the database");
    }
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
