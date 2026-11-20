const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./config/db');
const { router: authRouter } = require('./routes/authRoutes');
const restaurantRouter = require('./routes/restaurantRoutes');
const foodRouter = require('./routes/foodRoutes');
const orderRouter = require('./routes/orderRoutes');
const adminRouter = require('./routes/adminRoutes');
const customerRouter = require('./routes/customerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
    origin: true,
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'foodiehub_secure_session_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true if using HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Static files (Frontend: HTML, CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/customers', customerRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/foods', foodRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);

// Contact Us endpoint
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }
    console.log(`📩 New Contact Message from ${name} (${email}): [${subject || 'General'}] ${message}`);
    res.json({
        success: true,
        message: 'Thank you for contacting FoodieHub! Our team will respond shortly.'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error occurred.'
    });
});

// Start server
app.listen(PORT, async () => {
    console.log('========================================================');
    console.log(`🚀 FoodieHub Server running on http://localhost:${PORT}`);
    console.log('========================================================');
    await testConnection();
});

module.exports = app;
