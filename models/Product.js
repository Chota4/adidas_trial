class Product {
  constructor(pool) {
    this.pool = pool;
  }

  // Create Product table (optional migration method)
  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        image_public_id TEXT NOT NULL,
        brand VARCHAR(255) DEFAULT 'Adidas',
        category VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        rating NUMERIC DEFAULT 0,
        num_reviews INTEGER DEFAULT 0,
        price NUMERIC DEFAULT 0,
        count_in_stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pool.query(query);
  }

  // Create a new product
  async create(productData) {
    const {
      user_id,
      name,
      image_url,
      image_public_id,
      brand = 'Adidas',
      category,
      description,
      rating = 0,
      num_reviews = 0,
      price = 0,
      count_in_stock = 0,
    } = productData;

    const query = `
      INSERT INTO products (
        user_id, name, image_url, image_public_id, brand, category, description, rating, num_reviews, price, count_in_stock
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *;
    `;

    const values = [
      user_id,
      name,
      image_url,
      image_public_id,
      brand,
      category,
      description,
      rating,
      num_reviews,
      price,
      count_in_stock,
    ];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  // Find product by ID
  async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    const { rows } = await this.pool.query(query, [id]);
    return rows[0];
  }

  // Get all products
  async findAll() {
    const query = 'SELECT * FROM products ORDER BY created_at DESC';
    const { rows } = await this.pool.query(query);
    return rows;
  }

  // Update product by ID
  async update(id, updateData) {
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const key in updateData) {
      setClauses.push(`${key} = $${idx}`);
      values.push(updateData[key]);
      idx++;
    }
    values.push(id);

    const query = `
      UPDATE products
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${idx}
      RETURNING *;
    `;

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  // Delete product by ID
  async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const { rows } = await this.pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = Product;