// dotenv is optional — it isn't bundled into the packaged desktop build, where
// every value below is supplied by main.cjs or falls back to its default.
try {
  require('dotenv').config();
} catch {
  // No .env support available.
}

const path = require('path');

module.exports = {
  DB_PATH: process.env.DB_PATH ?? path.join(__dirname, 'shot_counter.db'),
  PORT: process.env.PORT ?? 5000,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
};
