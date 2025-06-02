require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const fileupload = require('express-fileupload');
const ejs = require('ejs');
const connectDB = require('./backend/config/db');
const upload = require('./backend/utils/uploadImage');

// Connect to database
connectDB();

const app = express();

// View engine
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'Chota',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
// Add temporary debug log:
console.log('Session secret:', process.env.SESSION_SECRET ? 'Loaded' : 'MISSING!');
app.use(flash());
app.use(fileupload());

// Routes
const authRoutes = require('./backend/routes/authRoutes');
app.use('/auth', authRoutes); 
app.use('/', require('./backend/routes/authRoutes'));
app.use('/products', require('./backend/routes/productRoutes'));
app.use('/users', require('./backend/routes/userRoutes'));

// Handle file uploads
app.post('/upload', upload.single('image'), (req, res) => {
  res.json({ imageUrl: req.file.path });
});

// Error handling
app.use(require('./backend/middleware/auth').notFound);
app.use(require('./backend/middleware/error').errorHandler);
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('error', { 
      error: 'File too large (max 5MB)' 
    });
  }
  // ... other error checks
});

// In app.js - Test basic server
app.get('/ping', (req, res) => res.send('pong'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));