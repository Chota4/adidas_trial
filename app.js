require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const fileupload = require('express-fileupload');
const ejs = require('ejs');
const connectDB = require('./config/db');
const upload = require('./utils/uploadImage');

// Connect to database
connectDB();

const app = express();

// View engine
app.set('views', path.join(__dirname, '../client/views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.static(path.join(__dirname, '../client/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(fileupload());

// Routes
app.use('/', require('./routes/authRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/users', require('./routes/userRoutes'));

// Handle file uploads
app.post('/upload', upload.single('image'), (req, res) => {
  res.json({ imageUrl: req.file.path });
});

// Error handling
app.use(require('./middleware/error').notFound);
app.use(require('./middleware/error').errorHandler);
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('error', { 
      error: 'File too large (max 5MB)' 
    });
  }
  // ... other error checks
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));