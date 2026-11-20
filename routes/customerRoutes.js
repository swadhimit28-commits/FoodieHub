const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const router = express.Router();

function requireOwnerOrAdmin(req, res, next) {
    const customerId = parseInt(req.params.id, 10);
    const isOwner = req.session?.customer?.customer_id === customerId;
    if (!isOwner && !req.session?.admin) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
}

router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, address, city, state, pincode, password } = req.body;
        if (!name || !email || !phone || !address || !city || !state || !pincode || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }
        if (phone.replace(/\D/g, '').length < 10) {
            return res.status(400).json({ success: false, message: 'Phone number must have at least 10 digits.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const [existing] = await pool.query('SELECT customer_id FROM customers WHERE email = ?', [normalizedEmail]);
        if (existing.length) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO customers (name, email, phone, address, city, state, pincode, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name.trim(), normalizedEmail, phone.trim(), address.trim(), city.trim(), state.trim(), pincode.trim(), hashedPassword]
        );
        const customer = {
            customer_id: result.insertId,
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim()
        };
        req.session.customer = customer;
        res.status(201).json({ success: true, message: 'Registration successful!', customer });
    } catch (err) {
        console.error('Customer registration error:', err);
        res.status(500).json({ success: false, message: 'Could not register customer.' });
    }
});

router.get('/:id', requireOwnerOrAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT customer_id, name, email, phone, address, city, state, pincode, created_at FROM customers WHERE customer_id = ?',
            [req.params.id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not retrieve customer.' });
    }
});

router.put('/:id', requireOwnerOrAdmin, async (req, res) => {
    try {
        const { name, email, phone, address, city, state, pincode, password } = req.body;
        if (!name || !email || !phone || !address || !city || !state || !pincode) {
            return res.status(400).json({ success: false, message: 'All customer fields are required.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }

        let passwordSql = '';
        let params = [name.trim(), email.trim().toLowerCase(), phone.trim(), address.trim(), city.trim(), state.trim(), pincode.trim()];
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
            }
            passwordSql = ', password = ?';
            params.push(await bcrypt.hash(password, 10));
        }
        params.push(req.params.id);
        const [result] = await pool.query(
            `UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?${passwordSql} WHERE customer_id = ?`,
            params
        );
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }
        res.json({ success: true, message: 'Customer updated successfully.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Email address is already in use.' });
        }
        res.status(500).json({ success: false, message: 'Could not update customer.' });
    }
});

module.exports = router;
