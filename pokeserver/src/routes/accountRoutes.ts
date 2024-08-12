import { Router, Request, Response } from "express";
import pool from "../db";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    const result = await pool.query(
      "SELECT id, account_name, avg_iv, num_shiny, num_hundos, num_shundos, is_main FROM accounts WHERE user_id = $1",
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
  const userId = req.user?.id;

  try {
    const result = await pool.query(
      "SELECT account_name FROM accounts WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  const { account_name, is_main } = req.body;
  const userId = req.user?.id;

  if (!account_name || !userId) {
    return res
      .status(400)
      .json({ error: "Account name and User ID are required" });
  }

  try {
    if (is_main) {
      await pool.query(
        "UPDATE accounts SET is_main = FALSE WHERE user_id = $1",
        [userId]
      );
    }

    const result = await pool.query(
      "INSERT INTO accounts (user_id, account_name, is_main) VALUES ($1, $2, $3) RETURNING *",
      [userId, account_name, is_main]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { account_name, is_main } = req.body;
  const userId = req.user?.id;

  if (!account_name || !userId) {
    return res
      .status(400)
      .json({ error: "Account name and User ID are required" });
  }

  try {
    if (is_main) {
      await pool.query(
        "UPDATE accounts SET is_main = FALSE WHERE user_id = $1",
        [userId]
      );
    }

    const result = await pool.query(
      "UPDATE accounts SET account_name = $1, is_main = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
      [account_name, is_main, id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
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
    const userId = req.user?.id;

    try {
      const result = await pool.query(
        "DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json({ message: "Account deleted successfully" });
    } catch (err: any) {
      console.error("Error executing query:", err.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.delete("/", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    await pool.query("DELETE FROM accounts WHERE user_id = $1", [userId]);
    res.json({ message: "All accounts deleted successfully" });
  } catch (err: any) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
