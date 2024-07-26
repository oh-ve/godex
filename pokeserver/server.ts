import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pokemonRoutes from "./src/routes/pokemonRoutes";
import userRoutes from "./src/routes/userRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/pokemon", pokemonRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Pokémon API!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
