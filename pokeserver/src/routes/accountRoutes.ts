import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const router = Router();

// Get all accounts for the authenticated user
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    const result = await pool.query(
      "SELECT id, account_name FROM accounts WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a new account for the authenticated user
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  const { account_name } = req.body;
  const userId = req.user?.id;

  if (!account_name || !userId) {
    return res
      .status(400)
      .json({ error: "Account name and User ID are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO accounts (user_id, account_name) VALUES ($1, $2) RETURNING *",
      [userId, account_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
