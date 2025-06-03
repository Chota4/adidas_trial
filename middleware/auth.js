const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Verify JWT token middleware
const auth = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;
        
        if (!token) {
            throw new Error('No token provided');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Find user
        const user = await User.findById(decoded.id);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            throw new Error('Access denied');
        }
        next();
    } catch (error) {
        res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
};

// Guest only middleware (for login/register pages)
const guest = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (token) {
            // Redirect to dashboard if already logged in
            return res.redirect('/dashboard');
        }
        
        next();
    } catch (error) {
        next();
    }
};

// Flash message middleware
const flashMessage = (req, res, next) => {
    res.locals.messages = req.flash();
    next();
};

// Set user in locals for views
const setUserLocals = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded.id);
            
            if (user) {
                res.locals.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
            }
        }
        
        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    auth,
    isAdmin,
    guest,
    flashMessage,
    setUserLocals
};
