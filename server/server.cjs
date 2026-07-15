const os = require('os');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Database = require('better-sqlite3');
const config = require('./config.cjs');

const app = express();

app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(helmet());
app.use(express.json());

if (process.env.SERVE_STATIC) {
  app.use(express.static(process.env.SERVE_STATIC));
}

const db = new Database(config.DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0
  )
`);

const teamsSnapshot = () => db.prepare('SELECT id, name, counter FROM teams ORDER BY counter DESC, id ASC').all();

// Live sync: every mutation pushes the full (small) team list to all connected
// clients, so phones and the main screen stay in step without reloading.
const sseClients = new Set();

// A phone that vanishes mid-stream (Wi-Fi drop, lock screen) can leave a dead
// response behind until its 'close' fires; writing to it must never take the
// server down mid-party.
function sendToClient(client, payload) {
  try {
    client.write(payload);
  } catch {
    sseClients.delete(client);
  }
}

function broadcastTeams() {
  if (sseClients.size === 0) return;
  const payload = `event: teams\ndata: ${JSON.stringify(teamsSnapshot())}\n\n`;
  for (const client of sseClients) sendToClient(client, payload);
}

// Keep-alive comment so proxies and sleeping phones don't drop idle streams.
const heartbeat = setInterval(() => {
  for (const client of sseClients) sendToClient(client, ': ping\n\n');
}, 25000);
heartbeat.unref();

app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write(`event: teams\ndata: ${JSON.stringify(teamsSnapshot())}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
  res.on('error', () => sseClients.delete(res));
});

// LAN addresses for the join dialog — lets phones scan a QR code instead of
// the host running ipconfig. Link-local (169.254.x) addresses are useless
// for that, so they are filtered out.
app.get('/api/server-info', (_req, res) => {
  const ips = [];
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const net of interfaces ?? []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
        ips.push(net.address);
      }
    }
  }
  res.set('Cache-Control', 'no-store');
  res.json({ port: Number(config.PORT), ips });
});

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
    res.set('Cache-Control', 'no-store');
    res.json(teamsSnapshot());
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
    broadcastTeams();
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
    broadcastTeams();
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
    broadcastTeams();
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
    broadcastTeams();
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
    broadcastTeams();
    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New round: keep the teams, zero every counter.
app.post('/api/teams/reset', (_req, res) => {
  try {
    db.prepare('UPDATE teams SET counter = 0').run();
    broadcastTeams();
    res.json({ message: 'Counters reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SPA fallback — after API routes, only in production Electron mode
if (process.env.SERVE_STATIC) {
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(process.env.SERVE_STATIC, 'index.html'));
  });
}

// Error handler last, so it also catches failures from the SPA fallback above.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const serverReady = new Promise((resolve, reject) => {
  const server = app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
    resolve(config.PORT);
  });
  server.on('error', reject);
});

module.exports = { serverReady };
