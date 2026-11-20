const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// Middleware to verify customer session
function requireCustomer(req, res, next) {
    if (!req.session || !req.session.customer) {
        return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }
    next();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, address, city, state, pincode, password } = req.body;

        // Validation
        if (!name || !email || !phone || !address || !city || !state || !pincode || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }

        // Phone validation (at least 10 digits)
        if (phone.replace(/\D/g, '').length < 10) {
            return res.status(400).json({ success: false, message: 'Phone number must have at least 10 digits.' });
        }

        // Password length
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        // Check if email already exists
        const [existing] = await pool.query('SELECT customer_id FROM customers WHERE email = ?', [email.trim().toLowerCase()]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists. Please log in.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into MySQL
        const [result] = await pool.query(`
            INSERT INTO customers (name, email, phone, address, city, state, pincode, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name.trim(),
            email.trim().toLowerCase(),
            phone.trim(),
            address.trim(),
            city.trim(),
            state.trim(),
            pincode.trim(),
            hashedPassword
        ]);

        const customer = {
            customer_id: result.insertId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim()
        };

        // Save session
        req.session.customer = customer;

        res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to FoodieHub.',
            customer
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [email.trim().toLowerCase()]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const customerRecord = rows[0];
        const isMatch = await bcrypt.compare(password, customerRecord.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const customer = {
            customer_id: customerRecord.customer_id,
            name: customerRecord.name,
            email: customerRecord.email,
            phone: customerRecord.phone,
            address: customerRecord.address,
            city: customerRecord.city,
            state: customerRecord.state,
            pincode: customerRecord.pincode
        };

        req.session.customer = customer;

        res.json({
            success: true,
            message: `Welcome back, ${customer.name}!`,
            customer
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
    }
});

// GET /api/auth/current
router.get('/current', (req, res) => {
    if (req.session && req.session.customer) {
        return res.json({ success: true, customer: req.session.customer });
    }
    res.json({ success: false, customer: null });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.customer = null;
    res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = {
    router,
    requireCustomer
};
