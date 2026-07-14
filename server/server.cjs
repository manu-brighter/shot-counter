const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Database = require('better-sqlite3');
const config = require('./config.cjs');

const app = express();

if (process.env.SERVE_STATIC) {
  app.use(express.static(process.env.SERVE_STATIC));
}

app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(helmet());
app.use(express.json());

const db = new Database(config.DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0
  )
`);

app.get('/api/health', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: 'error', db: err.message });
  }
});

app.get('/api/teams', (_req, res) => {
  try {
    const teams = db.prepare('SELECT id, name, counter FROM teams ORDER BY counter DESC, id ASC').all();
    res.set('Cache-Control', 'no-store');
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/teams', (req, res) => {
  const { name } = req.body;
  if (typeof name !== 'string' || name.trim() === '' || name.length > 100) {
    return res.status(400).json({ error: 'Name is required and must be at most 100 characters' });
  }
  try {
    db.prepare('INSERT INTO teams (name, counter) VALUES (?, 0)').run(name);
    res.status(201).json({ message: 'Team added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/teams/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (typeof name !== 'string' || name.trim() === '' || name.length > 100) {
    return res.status(400).json({ error: 'Name is required and must be at most 100 characters' });
  }
  try {
    const result = db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Team not found' });
    res.json({ message: 'Team updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/teams/:id', (req, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Team not found' });
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/teams/:id/increment', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE teams SET counter = counter + 1 WHERE id = ?').run(id);
    const team = db.prepare('SELECT id, name, counter FROM teams WHERE id = ?').get(id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/teams/:id/decrement', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE teams SET counter = CASE WHEN counter > 0 THEN counter - 1 ELSE 0 END WHERE id = ?').run(id);
    const team = db.prepare('SELECT id, name, counter FROM teams WHERE id = ?').get(id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// SPA fallback — after API routes, only in production Electron mode
if (process.env.SERVE_STATIC) {
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(process.env.SERVE_STATIC, 'index.html'));
  });
}

const serverReady = new Promise((resolve) => {
  app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
    resolve(config.PORT);
  });
});

module.exports = { serverReady };
