import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const router = Router();

router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    console.log("Fetching Pokémon for user ID:", userId); // Add this log

    const result = await pool.query(
      "SELECT id, user_id, name, nickname, is_shiny, iv, date, ST_AsText(location) as location, distance FROM pokemon WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
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
});

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  const { user_id, name, nickname, is_shiny, iv, date, location } = req.body;

  try {
    // Calculate the distance from user's home location
    const distanceResult = await pool.query(
      "SELECT ST_Distance(ST_GeomFromText($1, 4326), home) / 1000 as distance FROM users WHERE id = $2",
      [location, user_id]
    );

    const distance = distanceResult.rows[0].distance;

    const result = await pool.query(
      "INSERT INTO pokemon (user_id, name, nickname, is_shiny, iv, date, location, distance) VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), $8) RETURNING *",
      [user_id, name, nickname, is_shiny, iv, date, location, distance]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, nickname, is_shiny, iv, date, location, distance } = req.body;
  try {
    const result = await pool.query(
      "UPDATE pokemon SET name = $1, nickname = $2, is_shiny = $3, iv = $4, date = $5, location = ST_GeogFromText($6), distance = $7 WHERE id = $8 RETURNING *",
      [name, nickname, is_shiny, iv, date, location, distance, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pokémon not found" });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "DELETE FROM pokemon WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Pokémon not found" });
      }
      res.json({ message: "Pokémon deleted successfully" });
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.delete("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM pokemon");
    res.json({ message: "All Pokémon deleted successfully" });
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
