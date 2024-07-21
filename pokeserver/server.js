const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Pokémon API!");
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/users", async (req, res) => {
  const { username, password, home } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users (username, password, home) VALUES ($1, $2, ST_GeogFromText($3)) RETURNING *",
      [username, password, home]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/pokemon", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pokemon");
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/pokemon", async (req, res) => {
  const { user_id, name, nickname, is_shiny, iv, date, location, distance } =
    req.body;
  try {
    const result = await pool.query(
      "INSERT INTO pokemon (user_id, name, nickname, is_shiny, iv, date, location, distance) VALUES ($1, $2, $3, $4, $5, $6, ST_GeogFromText($7), $8) RETURNING *",
      [user_id, name, nickname, is_shiny, iv, date, location, distance]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
