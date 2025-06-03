const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const productController = require('../controllers/productController');
const { auth, isAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Validation middleware
const productValidation = [
    check('name')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Product name must be at least 3 characters long'),
    check('description')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    check('price')
        .isFloat({ min: 0.01 })
        .withMessage('Price must be a positive number'),
    check('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required'),
    check('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer')
];

const stockValidation = [
    check('quantity')
        .isInt()
        .withMessage('Quantity must be an integer')
];

const reviewValidation = [
    check('rating')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5')
];

// Public routes
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProduct);

// Protected routes (require authentication)
router.post('/', auth, isAdmin, upload.array('images', 5), productValidation, productController.createProduct);
router.put('/:id', auth, isAdmin, upload.array('images', 5), productValidation, productController.updateProduct);
router.delete('/:id', auth, isAdmin, productController.deleteProduct);
router.patch('/:id/stock', auth, isAdmin, stockValidation, productController.updateStock);
router.post('/:id/reviews', auth, reviewValidation, productController.addReview);

// Error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File is too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            error: 'Error uploading file.'
        });
    }
    
    if (err.message === 'Not an image! Please upload an image.') {
        return res.status(400).json({
            error: err.message
        });
    }
    
    next(err);
});

module.exports = router;
