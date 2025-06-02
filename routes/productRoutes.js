const express = require('express');
const router = express.Router();
const upload = require('../utils/uploadImage'); // Local multer config
const ProductModel = require('../models/Product'); // PostgreSQL product model
const { protect, admin } = require('../middleware/auth');

// Inject PostgreSQL pool into Product model
router.use((req, res, next) => {
  const pool = req.app.locals.pool;
  req.models = {
    ...(req.models || {}),
    Product: new ProductModel(pool),
  };
  next();
});

// Load PostgreSQL-compatible productController
let controller;
try {
  controller = require('../controllers/productController');
} catch (err) {
  console.error('❌ Failed to load productController:', err);
  controller = {};
}

// Destructure controller functions
const {
  getProducts,
  getProduct,
  showNewProductForm,
  createProduct,
  showEditProductForm,
  updateProduct,
  deleteProduct,
} = controller;

// Admin dashboard - View all products
router.get('/admin', protect, admin, getProducts);

// Show form to create new product
router.get('/admin/new', protect, admin, showNewProductForm);

// Create new product (with image upload)
router.post('/admin/new', protect, admin, upload.single('image'), createProduct);

// Show edit form
router.get('/admin/:id/edit', protect, admin, showEditProductForm);

// Update product
router.put('/admin/:id', protect, admin, upload.single('image'), updateProduct);

// Delete product
router.delete('/admin/:id', protect, admin, deleteProduct);

// Public routes
router.get('/', getProducts);           // all products
router.get('/:id', getProduct);         // single product

module.exports = router;
