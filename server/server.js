const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mysql = require('mysql2');
const config = require('./config');

const app = express();
app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(helmet());
app.use(express.json());

const db = mysql.createPool({
  connectionLimit: 10,
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
});

app.get('/api/health', (_req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.error(err);
      return res.status(503).json({ status: 'error', db: err.message });
    }
    res.json({ status: 'ok', db: 'connected' });
  });
});

app.get('/api/teams', (_req, res) => {
  db.query(
    'SELECT id, name, counter FROM teams ORDER BY counter DESC, id ASC',
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.set('Cache-Control', 'no-store');
      res.json(results);
    }
  );
});

app.post('/api/teams', (req, res) => {
  const { name } = req.body;
  if (typeof name !== 'string' || name.trim() === '' || name.length > 100) {
    return res
      .status(400)
      .json({ error: 'Name is required and must be at most 100 characters' });
  }
  db.query(
    'INSERT INTO teams (name, counter) VALUES (?, 0)',
    [name],
    (err, _results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ message: 'Team added successfully' });
    },
  );
});

app.put('/api/teams/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (typeof name !== 'string' || name.trim() === '' || name.length > 100) {
    return res
      .status(400)
      .json({ error: 'Name is required and must be at most 100 characters' });
  }
  db.query(
    'UPDATE teams SET name = ? WHERE id = ?',
    [name, id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }
      res.json({ message: 'Team updated successfully' });
    },
  );
});

app.delete('/api/teams/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM teams WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ message: 'Team deleted successfully' });
  });
});

app.post('/api/teams/:id/increment', (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE teams SET counter = counter + 1 WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      db.query(
        'SELECT id, name, counter FROM teams WHERE id = ?',
        [id],
        (err2, results) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: 'Internal server error' });
          }
          if (!results.length) {
            return res.status(404).json({ error: 'Team not found' });
          }
          res.json(results[0]);
        }
      );
    }
  );
});

app.post('/api/teams/:id/decrement', (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE teams SET counter = GREATEST(counter - 1, 0) WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      db.query(
        'SELECT id, name, counter FROM teams WHERE id = ?',
        [id],
        (err2, results) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: 'Internal server error' });
          }
          if (!results.length) {
            return res.status(404).json({ error: 'Team not found' });
          }
          res.json(results[0]);
        }
      );
    }
  );
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.PORT, () =>
  console.log(`Server running on http://localhost:${config.PORT}`)
);
