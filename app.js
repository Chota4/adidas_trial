require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const { Pool } = require('pg');
const { auth, flashMessage, setUserLocals } = require('./middleware/auth');

const app = express();

// ===========================
// PostgreSQL Connection
// ===========================
const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DB || 'adidas_store',
    password: process.env.PG_PASSWORD || 'postgres',
    port: process.env.PG_PORT || 5432,
});

pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL'))
    .catch(err => console.error('❌ PostgreSQL connection error:', err));

// Make pool accessible in routes
app.locals.pool = pool;

// ===========================
// View engine
// ===========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===========================
// Global Middleware
// ===========================
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(flash());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    abortOnLimit: true
}));

// Custom middleware
app.use(flashMessage);
app.use(setUserLocals);

// ===========================
// Routes
// ===========================
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/users', userRoutes);

// Home route
app.get('/', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const featuredProducts = await Product.list({
            page: 1,
            limit: 8,
            featured: true
        });

        res.render('home', {
            title: 'Welcome to Adidas Store',
            featuredProducts: featuredProducts.products
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.render('home', {
            title: 'Welcome to Adidas Store',
            featuredProducts: []
        });
    }
});

// Dashboard routes
app.get('/dashboard', auth, (req, res) => {
    if (req.user.role === 'admin') {
        res.redirect('/admin/dashboard');
    } else {
        res.render('user/dashboard', {
            title: 'My Dashboard'
        });
    }
});

app.get('/admin/dashboard', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        req.flash('error', 'Access denied');
        return res.redirect('/dashboard');
    }

    try {
        const Order = require('./models/order');
        const Product = require('./models/Product');
        const User = require('./models/user');

        const [orderStats, products, users] = await Promise.all([
            Order.list({ page: 1, limit: 5 }),
            Product.list({ page: 1, limit: 5 }),
            User.list(1, 5)
        ]);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            orderStats,
            products: products.products,
            users: users.users
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        req.flash('error', 'Error loading dashboard data');
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            orderStats: { orders: [] },
            products: [],
            users: []
        });
    }
});

// ===========================
// Error Handlers
// ===========================

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('errors/404', {
        title: 'Page Not Found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File is too large. Maximum size is 5MB.'
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // Handle database errors
    if (err.code === '23505') { // Unique violation
        return res.status(400).json({
            error: 'Record already exists'
        });
    }

    // Default error
    res.status(err.status || 500).render('errors/500', {
        title: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// ===========================
// Start Server
// ===========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
