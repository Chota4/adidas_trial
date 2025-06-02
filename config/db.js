// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DB || 'myappdb',
  password: process.env.PG_PASSWORD || 'yourpassword',
  port: process.env.PG_PORT || 5432,
});

pool.connect()
  .then(() => console.log(`✅ PostgreSQL Connected: ${pool.options?.host || 'localhost'}`))
  .catch((err) => {
    console.error(`❌ PostgreSQL Connection Error: ${err.message}`);
    process.exit(1);
  });

module.exports = pool;