import express, { Request, Response } from "express";
import { Pool } from "pg";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pokemonRoutes from "./src/routes/pokemonRoutes";
import { authenticateToken } from "./src/middleware/auth";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post("/api/register", async (req: Request, res: Response) => {
  const { username, password, home } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (username, password, home) VALUES ($1, $2, ST_GeogFromText($3)) RETURNING *",
      [username, hashedPassword, home]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({ accessToken });
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(
  "/api/update-home",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { home } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    try {
      const result = await pool.query(
        "UPDATE users SET home = ST_GeogFromText($1) WHERE id = $2 RETURNING *",
        [home, userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/api/protected", authenticateToken, (req: Request, res: Response) => {
  res.json({ message: "This is a protected route", user: req.user });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Pokémon API!");
});

app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/users", async (req: Request, res: Response) => {
  const { username, password, home } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      "INSERT INTO users (username, password, home) VALUES ($1, $2, ST_GeogFromText($3)) RETURNING *",
      [username, hashedPassword, home]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/api/pokemon", pokemonRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
