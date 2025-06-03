const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const orderController = require('../controllers/orderController');
const { auth, isAdmin } = require('../middleware/auth');

// Validation middleware
const orderValidation = [
    check('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    check('items.*.product_id')
        .isInt()
        .withMessage('Invalid product ID'),
    check('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    check('shipping_address')
        .isObject()
        .withMessage('Shipping address is required'),
    check('shipping_address.street')
        .trim()
        .notEmpty()
        .withMessage('Street address is required'),
    check('shipping_address.city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    check('shipping_address.state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    check('shipping_address.zipCode')
        .trim()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Invalid ZIP code'),
    check('shipping_address.country')
        .trim()
        .notEmpty()
        .withMessage('Country is required'),
    check('billing_address')
        .isObject()
        .withMessage('Billing address is required'),
    check('billing_address.street')
        .trim()
        .notEmpty()
        .withMessage('Street address is required'),
    check('billing_address.city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    check('billing_address.state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    check('billing_address.zipCode')
        .trim()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Invalid ZIP code'),
    check('billing_address.country')
        .trim()
        .notEmpty()
        .withMessage('Country is required'),
    check('payment_method')
        .isObject()
        .withMessage('Payment method is required'),
    check('payment_method.type')
        .trim()
        .isIn(['credit_card', 'paypal'])
        .withMessage('Invalid payment method')
];

const statusValidation = [
    check('status')
        .trim()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Invalid order status')
];

// User routes
router.post('/', auth, orderValidation, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/my-orders/:id', auth, orderController.getOrder);
router.get('/track/:orderNumber', auth, orderController.getOrderByNumber);

// Admin routes
router.get('/', auth, isAdmin, orderController.getAllOrders);
router.get('/stats', auth, isAdmin, orderController.getOrderStats);
router.patch('/:id/status', auth, isAdmin, statusValidation, orderController.updateOrderStatus);
router.get('/:id', auth, isAdmin, orderController.getOrder);

module.exports = router; 