import express, { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JwtPayload } from "jsonwebtoken";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

interface UserPayload extends JwtPayload {
  id: number;
  username: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload;
  }
}

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.log("No token provided");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
      console.log("JWT verification failed:", err);
      return res.sendStatus(403);
    }
    req.user = user as UserPayload;
    next();
  });
};

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

app.get(
  "/api/pokemon",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT * FROM pokemon");
      res.json(result.rows);
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/api/pokemon",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { user_id, name, nickname, is_shiny, iv, date, location, distance } =
      req.body;
    try {
      const result = await pool.query(
        "INSERT INTO pokemon (user_id, name, nickname, is_shiny, iv, date, location, distance) VALUES ($1, $2, $3, $4, $5, $6, ST_GeogFromText($7), $8) RETURNING *",
        [user_id, name, nickname, is_shiny, iv, date, location, distance]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/pokemon/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM pokemon WHERE id = $1", [
        id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Pokémon not found" });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.delete(
  "/api/pokemon",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await pool.query("DELETE FROM pokemon");
      res.json({ message: "All Pokémon deleted successfully" });
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
