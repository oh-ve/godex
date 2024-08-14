import { Router, Request, Response } from "express";
import { pool } from "../../server.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth";

const userRoutes = Router();

userRoutes.post("/register", async (req: Request, res: Response) => {
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

userRoutes.post("/login", async (req: Request, res: Response) => {
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

userRoutes.post(
  "/update-home",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { home } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        console.log("Received home:", home);

        const match = home.match(/POINT\(([-.\d]+) ([-.\d]+)\)/);
        if (!match) {
          throw new Error("Invalid location format");
        }
        const [_, lon, lat] = match;

        console.log("Parsed coordinates:", lon, lat);

        await client.query(
          "UPDATE users SET home = ST_SetSRID(ST_Point($1, $2), 4326)::geography WHERE id = $3",
          [lon, lat, userId]
        );

        await client.query(
          `UPDATE pokemon
           SET distance = ST_Distance(location::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography) / 1000
           WHERE user_id = $3`,
          [lon, lat, userId]
        );

        await client.query("COMMIT");
        res.json({
          message:
            "Home location updated and distances recalculated successfully!",
        });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error executing query:", (err as Error).stack);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error connecting to database:", (err as Error).stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

userRoutes.get(
  "/protected",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    try {
      console.log("Fetching details for user ID:", userId);

      const result = await pool.query(
        "SELECT id, username, ST_AsText(home) as home FROM users WHERE id = $1",
        [userId]
      );

      console.log("Query result:", result.rows);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result.rows[0];
      res.json({ user });
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

userRoutes.get("/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

userRoutes.post("/users", async (req: Request, res: Response) => {
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

export default userRoutes;
