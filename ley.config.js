const url = new URL(process.env.DATABASE_URL || process.env.PGURL);

module.exports = {
  host: url.hostname,
  port: url.port || 5432,
  database: url.pathname.slice(1),
  username: url.username, // postgres.js uses 'username' instead of 'user'
  password: url.password,
  ssl: 'require'
};
