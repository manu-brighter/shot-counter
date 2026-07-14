try { require('dotenv').config(); } catch (_) {}

const path = require('path');

module.exports = {
  DB_PATH: process.env.DB_PATH ?? path.join(__dirname, 'shot_counter.db'),
  PORT: process.env.PORT ?? 5000,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
};
