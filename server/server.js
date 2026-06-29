const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mysql = require("mysql2");
const config = require("./config");

const app = express();
app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(helmet());
app.use(express.json());

const db = mysql.createConnection({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database!");
});

app.get("/api/teams", (req, res) => {
  db.query("SELECT * FROM teams", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post("/api/teams", (req, res) => {
  const { name, counter } = req.body;
  if (typeof name !== "string" || name.trim() === "" || name.length > 100) {
    return res
      .status(400)
      .json({ error: "Name is required and must be at most 100 characters" });
  }
  db.query(
    "INSERT INTO teams (name, counter) VALUES (?, ?)",
    [name, counter || 0],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error adding team" });
      }
      res.status(201).json({ message: "Team added successfully" });
    }
  );
});

app.put("/api/teams/:id", (req, res) => {
  const { id } = req.params;
  const { name, counter } = req.body;
  if (typeof name !== "string" || name.trim() === "" || name.length > 100) {
    return res
      .status(400)
      .json({ error: "Name is required and must be at most 100 characters" });
  }
  if (!(Number.isInteger(Number(counter)) && Number(counter) >= 0)) {
    return res.status(400).json({ error: "Invalid counter value" });
  }
  db.query(
    "UPDATE teams SET name = ?, counter = ? WHERE id = ?",
    [name, counter, id],
    (err, results) => {
      if (err) throw err;
      res.json({ message: "Team updated successfully" });
    }
  );
});

app.delete("/api/teams/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM teams WHERE id = ?", [id], (err, results) => {
    if (err) throw err;
    res.json({ message: "Team deleted successfully" });
  });
});

app.listen(config.PORT, () =>
  console.log(`Server running on http://localhost:${config.PORT}`)
);
