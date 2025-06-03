const Order = require('../models/order');
const User = require('../models/user');
const { validationResult } = require('express-validator');

// Create new order
const createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            items,
            shipping_address,
            billing_address,
            payment_method,
            notes
        } = req.body;

        const order = await Order.create({
            user_id: req.user.id,
            items,
            shipping_address,
            billing_address,
            payment_method,
            notes
        });

        // Add loyalty points (1 point per $10 spent)
        const loyaltyPoints = Math.floor(order.total / 10);
        await User.addLoyaltyPoints(req.user.id, loyaltyPoints);

        res.status(201).json(order);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get user's orders
const getUserOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const orders = await Order.findByUserId(req.user.id, parseInt(page), parseInt(limit));
        res.json(orders);
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get single order
const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user is authorized to view this order
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status } = req.body;
        const order = await Order.updateStatus(req.params.id, status);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        if (error.message === 'Invalid order status') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const orders = await Order.list(parseInt(page), parseInt(limit), status);
        res.json(orders);
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get order by order number
const getOrderByNumber = async (req, res) => {
    try {
        const order = await Order.findByOrderNumber(req.params.orderNumber);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user is authorized to view this order
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        console.error('Get order by number error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get order statistics (admin only)
const getOrderStats = async (req, res) => {
    try {
        const stats = {
            pending: await Order.countByStatus('pending'),
            processing: await Order.countByStatus('processing'),
            shipped: await Order.countByStatus('shipped'),
            delivered: await Order.countByStatus('delivered'),
            cancelled: await Order.countByStatus('cancelled'),
            total: await Order.countTotal(),
            revenue: await Order.calculateTotalRevenue()
        };

        res.json(stats);
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrder,
    updateOrderStatus,
    getAllOrders,
    getOrderByNumber,
    getOrderStats
}; 