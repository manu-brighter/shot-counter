require('dotenv').config();

module.exports = {
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ?? 3306,
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? 'root',
  DB_NAME: process.env.DB_NAME ?? 'shot_counter',
  PORT: process.env.PORT ?? 5000,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
};
