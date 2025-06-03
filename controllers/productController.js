const pool = require('../config/db'); // PostgreSQL pool
const cloudinary = require('../utils/cloudinary');
const multer = require('multer');
const path = require('path');

// Multer config (optional, if used elsewhere)
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Show form to create new product
exports.showNewProductForm = (req, res) => {
  res.render('admin/products/new');
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, brand } = req.body;

    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'products'
      });
      imageUrl = result.secure_url;
    }

    const insertQuery = `
      INSERT INTO products (name, price, description, brand, image)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const values = [name, price, description, brand, imageUrl];
    const result = await pool.query(insertQuery, values);

    console.log('Product created with ID:', result.rows[0].id);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).send('Error creating product');
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.render('products/index', { products: result.rows });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).send('Error fetching products');
  }
};

// Get product by ID
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Product not found');
    }
    res.render('products/show', { product: result.rows[0] });
  } catch (err) {
    console.error('Error fetching product:', err.message);
    res.status(500).send('Error fetching product');
  }
};

// Show edit form
exports.showEditProductForm = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Product not found');
    }
    res.render('admin/products/edit', { product: result.rows[0] });
  } catch (err) {
    console.error('Error fetching product for edit:', err.message);
    res.status(500).send('Error fetching product for edit');
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, brand } = req.body;

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'products'
      });
      imageUrl = result.secure_url;
    }

    const updateQuery = imageUrl
      ? `UPDATE products SET name = $1, price = $2, description = $3, brand = $4, image = $5 WHERE id = $6`
      : `UPDATE products SET name = $1, price = $2, description = $3, brand = $4 WHERE id = $5`;

    const values = imageUrl
      ? [name, price, description, brand, imageUrl, id]
      : [name, price, description, brand, id];

    await pool.query(updateQuery, values);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating product:', err.message);
    res.status(500).send('Error updating product');
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).send('Error deleting product');
  }
};
