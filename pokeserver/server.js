const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.log("No token provided");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("JWT verification failed:", err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

app.post("/api/register", async (req, res) => {
  const { username, password, home } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO public.users (username, password, home) VALUES ($1, $2, ST_GeogFromText($3)) RETURNING *",
      [username, hashedPassword, home]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM public.users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ accessToken });
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

app.get("/", (req, res) => {
  res.send("Welcome to the Pokémon API!");
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/users", async (req, res) => {
  const { username, password, home } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      "INSERT INTO public.users (username, password, home) VALUES ($1, $2, ST_GeogFromText($3)) RETURNING *",
      [username, hashedPassword, home]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/pokemon", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.pokemon");
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/pokemon", authenticateToken, async (req, res) => {
  const { user_id, name, nickname, is_shiny, iv, date, location, distance } =
    req.body;
  try {
    const result = await pool.query(
      "INSERT INTO public.pokemon (user_id, name, nickname, is_shiny, iv, date, location, distance) VALUES ($1, $2, $3, $4, $5, $6, ST_GeogFromText($7), $8) RETURNING *",
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
