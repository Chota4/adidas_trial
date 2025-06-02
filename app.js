require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const fileupload = require('express-fileupload');
const ejs = require('ejs');
const { Pool } = require('pg');

const app = express();

// ===========================
// ✅ PostgreSQL Connection
// ===========================
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DB || 'myappdb',
  password: process.env.PG_PASSWORD || 'yourpassword',
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
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// ===========================
// Middleware
// ===========================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.Chota10 || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
// Add temporary debug log:
console.log('Session secret:', process.env.SESSION_SECRET ? 'Loaded' : 'MISSING!');
app.use(flash());
app.use(fileupload());

// ===========================
// File Upload Config
// ===========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
module.exports.upload = upload;

// ===========================
// File Upload Route
// ===========================
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    success: true,
    filePath: `/uploads/${req.file.filename}`
  });
});

// ===========================
// Test Route
// ===========================
app.get('/ping', (req, res) => res.send('pong'));

// ===========================
// Routes
// ===========================
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);

// ===========================
// Error Handler
// ===========================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// ===========================
// Start Server
// ===========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
