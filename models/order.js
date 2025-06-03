const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// Create orders and order_items tables if they don't exist
const createOrderTables = async () => {
    try {
        // Create orders table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                total DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                tax DECIMAL(10,2) NOT NULL,
                shipping_fee DECIMAL(10,2) NOT NULL,
                shipping_address JSONB NOT NULL,
                billing_address JSONB NOT NULL,
                payment_method JSONB NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create order_items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                size VARCHAR(10),
                color VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Orders tables created successfully');
    } catch (error) {
        console.error('❌ Error creating orders tables:', error);
        throw error;
    }
};

createOrderTables();

class Order {
    static async create(orderData) {
        const {
            user_id,
            items,
            shipping_address,
            billing_address,
            payment_method,
            notes = null
        } = orderData;

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Calculate totals
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.1; // 10% tax
            const shipping_fee = subtotal >= 100 ? 0 : 10; // Free shipping over $100
            const total = subtotal + tax + shipping_fee;

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (
                    user_id, order_number, subtotal, tax, shipping_fee, total,
                    shipping_address, billing_address, payment_method, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [
                    user_id,
                    this.generateOrderNumber(),
                    subtotal,
                    tax,
                    shipping_fee,
                    total,
                    shipping_address,
                    billing_address,
                    payment_method,
                    notes
                ]
            );

            const order = orderResult.rows[0];

            // Create order items and update product stock
            for (const item of items) {
                await client.query(
                    `INSERT INTO order_items (
                        order_id, product_id, quantity, price, size, color
                    ) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        order.id,
                        item.product_id,
                        item.quantity,
                        item.price,
                        item.size,
                        item.color
                    ]
                );

                // Update product stock
                await client.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2',
                    [item.quantity, item.product_id]
                );
            }

            await client.query('COMMIT');
            return this.findById(order.id);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async findById(id) {
        const orderResult = await pool.query(
            `SELECT o.*, 
                    json_agg(
                        json_build_object(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'quantity', oi.quantity,
                            'price', oi.price,
                            'size', oi.size,
                            'color', oi.color,
                            'product', (
                                SELECT json_build_object(
                                    'name', p.name,
                                    'images', p.images
                                )
                                FROM products p
                                WHERE p.id = oi.product_id
                            )
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.id = $1
             GROUP BY o.id`,
            [id]
        );

        return orderResult.rows[0];
    }

    static async findByOrderNumber(orderNumber) {
        const result = await pool.query(
            'SELECT * FROM orders WHERE order_number = $1',
            [orderNumber]
        );
        return result.rows[0];
    }

    static async findByUserId(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await pool.query(
            `SELECT * FROM orders 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM orders WHERE user_id = $1',
            [userId]
        );
        const total = parseInt(countResult.rows[0].count);

        return {
            orders: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async updateStatus(id, status) {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid order status');
        }

        const result = await pool.query(
            `UPDATE orders 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [status, id]
        );

        return result.rows[0];
    }

    static async list(page = 1, limit = 10, status = null) {
        const offset = (page - 1) * limit;
        let query = `
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let valueCounter = 1;

        if (status) {
            query += ` AND o.status = $${valueCounter}`;
            values.push(status);
            valueCounter++;
        }

        query += ` ORDER BY o.created_at DESC LIMIT $${valueCounter} OFFSET $${valueCounter + 1}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);

        const countQuery = status
            ? 'SELECT COUNT(*) FROM orders WHERE status = $1'
            : 'SELECT COUNT(*) FROM orders';
        const countValues = status ? [status] : [];
        const countResult = await pool.query(countQuery, countValues);
        const total = parseInt(countResult.rows[0].count);

        return {
            orders: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static generateOrderNumber() {
        const prefix = 'ORD';
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }
}

module.exports = Order; 