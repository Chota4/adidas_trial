const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// Create users table if it doesn't exist
const createUsersTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                phone VARCHAR(20),
                address TEXT,
                loyalty_points INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created successfully');
    } catch (error) {
        console.error('❌ Error creating users table:', error);
        throw error;
    }
};

createUsersTable();

class User {
    static async create({ name, email, password, role = 'user' }) {
        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            const result = await pool.query(
                `INSERT INTO users (name, email, password, role) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id, name, email, role, created_at`,
                [name, email, hashedPassword, role]
            );

            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT id, name, email, role, phone, address, loyalty_points, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async update(id, updates) {
        const allowedUpdates = ['name', 'phone', 'address'];
        const updateFields = [];
        const values = [];
        let counter = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedUpdates.includes(key)) {
                updateFields.push(`${key} = $${counter}`);
                values.push(value);
                counter++;
            }
        }

        if (updateFields.length === 0) return null;

        values.push(id);
        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $${counter} 
            RETURNING id, name, email, role, phone, address, loyalty_points, created_at
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, id]
        );
    }

    static async delete(id) {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
    }

    static async list(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await pool.query(
            `SELECT id, name, email, role, created_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        
        const countResult = await pool.query('SELECT COUNT(*) FROM users');
        const total = parseInt(countResult.rows[0].count);

        return {
            users: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async verifyPassword(user, password) {
        return bcrypt.compare(password, user.password);
    }

    static generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
    }

    static async addLoyaltyPoints(userId, points) {
        await pool.query(
            'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
            [points, userId]
        );
    }
}

module.exports = User;