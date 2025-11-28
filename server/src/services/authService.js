const bcrypt = require('bcrypt');
const pool = require('./db');

const SALT_ROUNDS = 10;

/**
 * Create a new user with hashed password
 */
async function createUser(email, password, firstName, lastName) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, first_name, last_name, role, status, created_at, updated_at`,
    [email, hashedPassword, firstName, lastName]
  );

  return result.rows[0];
}

/**
 * Find user by email (includes password_hash for authentication)
 */
async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
}

/**
 * Find user by ID (excludes password_hash)
 */
async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, status,
            avatar_url, email_verified, last_login_at, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Validate password against hashed password
 */
async function validatePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Update user's last login timestamp
 */
async function updateLastLogin(userId) {
  await pool.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [userId]
  );
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  validatePassword,
  updateLastLogin
};
