const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Middleware to verify admin session
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.admin) {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    next();
}

// GET /api/restaurants - List all restaurants with food counts
router.get('/', async (req, res) => {
    try {
        const [restaurants] = await pool.query(`
            SELECT r.*, COUNT(f.food_id) as total_items
            FROM restaurants r
            LEFT JOIN food_items f ON r.restaurant_id = f.restaurant_id
            GROUP BY r.restaurant_id
            ORDER BY r.name ASC
        `);
        res.json({ success: true, count: restaurants.length, data: restaurants });
    } catch (err) {
        console.error('Error fetching restaurants:', err);
        res.status(500).json({ success: false, message: 'Could not fetch restaurants.' });
    }
});

// GET /api/restaurants/:id - Single restaurant with foods
router.get('/:id', async (req, res) => {
    try {
        const restId = parseInt(req.params.id, 10);
        const [restaurants] = await pool.query('SELECT * FROM restaurants WHERE restaurant_id = ?', [restId]);
        if (restaurants.length === 0) {
            return res.status(404).json({ success: false, message: 'Restaurant not found.' });
        }

        const [foods] = await pool.query('SELECT * FROM food_items WHERE restaurant_id = ? ORDER BY category, name', [restId]);

        res.json({
            success: true,
            restaurant: restaurants[0],
            foods
        });
    } catch (err) {
        console.error('Error fetching restaurant details:', err);
        res.status(500).json({ success: false, message: 'Could not fetch restaurant details.' });
    }
});

// POST /api/restaurants - Create new restaurant (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, cuisine, address, rating, image_url } = req.body;
        if (!name || !cuisine || !address) {
            return res.status(400).json({ success: false, message: 'Name, cuisine, and address are required.' });
        }

        const defaultImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
        const [result] = await pool.query(
            'INSERT INTO restaurants (name, cuisine, address, rating, image_url) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), cuisine.trim(), address.trim(), parseFloat(rating) || 4.5, image_url || defaultImage]
        );

        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully.',
            restaurant_id: result.insertId
        });
    } catch (err) {
        console.error('Error creating restaurant:', err);
        res.status(500).json({ success: false, message: 'Could not create restaurant.' });
    }
});

// PUT /api/restaurants/:id - Update restaurant (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const restId = parseInt(req.params.id, 10);
        const { name, cuisine, address, rating, image_url } = req.body;

        const [result] = await pool.query(
            'UPDATE restaurants SET name = ?, cuisine = ?, address = ?, rating = ?, image_url = ? WHERE restaurant_id = ?',
            [name.trim(), cuisine.trim(), address.trim(), parseFloat(rating) || 4.5, image_url, restId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Restaurant not found.' });
        }

        res.json({ success: true, message: 'Restaurant updated successfully.' });
    } catch (err) {
        console.error('Error updating restaurant:', err);
        res.status(500).json({ success: false, message: 'Could not update restaurant.' });
    }
});

// DELETE /api/restaurants/:id - Delete restaurant (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const restId = parseInt(req.params.id, 10);
        const [result] = await pool.query('DELETE FROM restaurants WHERE restaurant_id = ?', [restId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Restaurant not found.' });
        }

        res.json({ success: true, message: 'Restaurant deleted successfully.' });
    } catch (err) {
        console.error('Error deleting restaurant:', err);
        res.status(500).json({ success: false, message: 'Could not delete restaurant.' });
    }
});

module.exports = router;
