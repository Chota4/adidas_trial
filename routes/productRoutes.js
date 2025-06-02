const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  showNewProductForm,
  createProduct,
  showEditProductForm,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../utils/uploadImage');

router.route('/')
  .get(getProducts);

router.route('/:id')
  .get(getProduct);

// Admin routes
router.route('/admin')
  .get(protect, admin, getProducts);

router.route('/admin/new')
  .get(protect, admin, showNewProductForm)
  .post(protect, admin, upload.single('image'), createProduct);

router.route('/admin/:id/edit')
  .get(protect, admin, showEditProductForm)
  .put(protect, admin, upload.single('image'), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;