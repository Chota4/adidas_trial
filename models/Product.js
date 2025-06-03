const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// Create products table if it doesn't exist
const createProductsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                original_price DECIMAL(10,2),
                category VARCHAR(50) NOT NULL,
                subcategory VARCHAR(50),
                brand VARCHAR(50) DEFAULT 'Adidas',
                stock INTEGER NOT NULL DEFAULT 0,
                images TEXT[],
                sizes TEXT[],
                colors TEXT[],
                tags TEXT[],
                rating DECIMAL(3,2) DEFAULT 0,
                review_count INTEGER DEFAULT 0,
                is_featured BOOLEAN DEFAULT false,
                is_new BOOLEAN DEFAULT true,
                is_sale BOOLEAN DEFAULT false,
                discount_percent INTEGER,
                sku VARCHAR(50) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Products table created successfully');
    } catch (error) {
        console.error('❌ Error creating products table:', error);
        throw error;
    }
};

createProductsTable();

class Product {
    static async create(productData) {
        const {
            name, description, price, category, subcategory = null,
            stock = 0, images = [], sizes = [], colors = [],
            tags = [], is_featured = false, original_price = null
        } = productData;

        try {
            const result = await pool.query(
                `INSERT INTO products (
                    name, description, price, original_price, category, 
                    subcategory, stock, images, sizes, colors, tags, 
                    is_featured, sku
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *`,
                [
                    name, description, price, original_price, category,
                    subcategory, stock, images, sizes, colors, tags,
                    is_featured, this.generateSKU(name)
                ]
            );

            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Product with this SKU already exists');
            }
            throw error;
        }
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async findBySKU(sku) {
        const result = await pool.query('SELECT * FROM products WHERE sku = $1', [sku]);
        return result.rows[0];
    }

    static async update(id, updates) {
        const allowedUpdates = [
            'name', 'description', 'price', 'original_price', 'category',
            'subcategory', 'stock', 'images', 'sizes', 'colors', 'tags',
            'is_featured', 'is_sale', 'discount_percent'
        ];
        
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
            UPDATE products 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $${counter} 
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
    }

    static async list({
        page = 1,
        limit = 12,
        category = null,
        subcategory = null,
        minPrice = null,
        maxPrice = null,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        search = null,
        featured = null
    }) {
        let query = 'SELECT * FROM products WHERE 1=1';
        const values = [];
        let valueCounter = 1;

        if (category) {
            query += ` AND category = $${valueCounter}`;
            values.push(category);
            valueCounter++;
        }

        if (subcategory) {
            query += ` AND subcategory = $${valueCounter}`;
            values.push(subcategory);
            valueCounter++;
        }

        if (minPrice !== null) {
            query += ` AND price >= $${valueCounter}`;
            values.push(minPrice);
            valueCounter++;
        }

        if (maxPrice !== null) {
            query += ` AND price <= $${valueCounter}`;
            values.push(maxPrice);
            valueCounter++;
        }

        if (search) {
            query += ` AND (
                name ILIKE $${valueCounter} OR 
                description ILIKE $${valueCounter} OR 
                category ILIKE $${valueCounter}
            )`;
            values.push(`%${search}%`);
            valueCounter++;
        }

        if (featured !== null) {
            query += ` AND is_featured = $${valueCounter}`;
            values.push(featured);
            valueCounter++;
        }

        // Add sorting
        const allowedSortFields = ['price', 'created_at', 'name', 'rating'];
        const allowedSortOrders = ['ASC', 'DESC'];
        
        const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
        
        query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

        // Add pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT $${valueCounter} OFFSET $${valueCounter + 1}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
        if (category) countQuery += ' AND category = $1';
        if (subcategory) countQuery += ' AND subcategory = $2';
        
        const countResult = await pool.query(countQuery, values.slice(0, 2));
        const total = parseInt(countResult.rows[0].count);

        return {
            products: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async updateStock(id, quantity) {
        const result = await pool.query(
            'UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING stock',
            [quantity, id]
        );
        return result.rows[0];
    }

    static async addReview(id, rating) {
        await pool.query(`
            UPDATE products 
            SET rating = ((rating * review_count) + $1) / (review_count + 1),
                review_count = review_count + 1 
            WHERE id = $2`,
            [rating, id]
        );
    }

    static generateSKU(name) {
        const prefix = 'AD';
        const timestamp = Date.now().toString().slice(-6);
        const nameHash = name
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 3);
        return `${prefix}-${nameHash}-${timestamp}`;
    }
}

module.exports = Product;