const bcrypt = require('bcryptjs');

class UserModel {
  constructor(pool) {
    this.pool = pool;
  }

  // Create a new user
  async createUser({ name, email, password, isAdmin = false, avatar }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, password, is_admin, avatar)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [name, email, hashedPassword, isAdmin, avatar || '/images/default-avatar.png'];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  async findByEmail(email) {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  // Compare passwords
  async matchPassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
}

module.exports = UserModel;