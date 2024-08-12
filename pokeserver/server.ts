import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pokemonRoutes from "./src/routes/pokemonRoutes";
import accountRoutes from "./src/routes/accountRoutes";
import userRoutes from "./src/routes/userRoutes";
import pool from "./src/db";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/pokemon", pokemonRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Pokémon API!");
});

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to the database", err);
  } else {
    console.log("Connected to the database");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
