const { Pool } = require("pg");

// init pg pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  onConnect: () => console.log("Connected to postgres"),
});

// init database
const initializeDatabase = async () => {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY,
      content TEXT NOT NULL,
      source TEXT NOT NULL,
      embedding VECTOR(3072)
    )
  `);

  console.log("Database migration run successfully");
};

module.exports = { pool, initializeDatabase };
