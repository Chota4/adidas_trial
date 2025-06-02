const express = require('express');
const router = express.Router();
const Imageupload = require('../utils/uploadImage');
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

// Public routes
router.route('/')
  .get(getProducts);

router.route('/:id')
  .get(getProduct);

// Admin routes
router.route('/admin')
  .get(protect, admin, getProducts);

// Product creation route
router.post('/admin/new', 
protect, 
admin, 
upload.single('image'), // Middleware for single image upload
createProduct
);

// Product update route  
router.put('/admin/:id',
protect,
admin,
upload.single('image'), // Middleware for single image upload
updateProduct
);
module.exports = router;