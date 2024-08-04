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

    console.log("Fetching Pokémon for user ID:", userId);

    const result = await pool.query(
      `SELECT p.id, p.user_id, p.account_id, p.name, p.nickname, p.is_shiny, p.iv, p.date, ST_AsText(p.location) as location, p.distance, a.account_name
       FROM pokemon p
       LEFT JOIN accounts a ON p.account_id = a.id
       WHERE p.user_id = $1`,
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
    const result = await pool.query(
      "SELECT id, user_id, account_id, name, nickname, is_shiny, iv, date, ST_AsText(location) as location, distance FROM pokemon WHERE id = $1",
      [id]
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

router.get(
  "/account/:accountId",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { accountId } = req.params;
    try {
      const result = await pool.query(
        "SELECT id, user_id, account_id, name, nickname, is_shiny, iv, date, ST_AsText(location) as location, distance FROM pokemon WHERE account_id = $1",
        [accountId]
      );
      res.json(result.rows);
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  const { user_id, account_id, name, nickname, is_shiny, iv, date, location } =
    req.body;

  try {
    const distanceResult = await pool.query(
      "SELECT ST_Distance(ST_GeomFromText($1, 4326), home) / 1000 as distance FROM users WHERE id = $2",
      [location, user_id]
    );

    const distance = distanceResult.rows[0]?.distance || 0;

    const result = await pool.query(
      "INSERT INTO pokemon (user_id, account_id, name, nickname, is_shiny, iv, date, location, distance) VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeomFromText($8, 4326), $9) RETURNING *",
      [
        user_id,
        account_id,
        name,
        nickname,
        is_shiny,
        iv,
        date,
        location,
        distance,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, nickname, is_shiny, iv, date, location, account_id } = req.body;
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update the Pokémon details including the location and account
      const updateResult = await client.query(
        "UPDATE pokemon SET name = $1, nickname = $2, is_shiny = $3, iv = $4, date = $5, location = ST_GeomFromText($6, 4326), account_id = $7 WHERE id = $8 RETURNING *",
        [name, nickname, is_shiny, iv, date, location, account_id, id]
      );

      if (updateResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Pokémon not found" });
      }

      const pokemon = updateResult.rows[0];

      // Recalculate the distance from the user's home location
      const distanceResult = await client.query(
        "SELECT ST_Distance(ST_GeomFromText($1, 4326)::geography, home::geography) / 1000 as distance FROM users WHERE id = $2",
        [location, pokemon.user_id]
      );

      const distance = distanceResult.rows[0]?.distance || 0;

      // Update the distance in the Pokémon record
      await client.query("UPDATE pokemon SET distance = $1 WHERE id = $2", [
        distance,
        id,
      ]);

      await client.query("COMMIT");
      res.json(updateResult.rows[0]);
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
