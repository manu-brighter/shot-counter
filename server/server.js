const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "shot_counter",
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
