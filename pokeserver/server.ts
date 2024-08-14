import express, { Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import pokemonRoutes from "./src/routes/pokemonRoutes";
import accountRoutes from "./src/routes/accountRoutes";
import userRoutes from "./src/routes/userRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false,
  },
});
export { pool };

app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/pokemon", pokemonRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Pokémon API!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
