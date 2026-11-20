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

// GET /api/foods - Search, filter by category and restaurant
router.get('/', async (req, res) => {
    try {
        const { search, category, restaurant_id, available_only } = req.query;

        let query = `
            SELECT f.*, r.name AS restaurant_name, r.cuisine AS restaurant_cuisine, r.rating AS restaurant_rating
            FROM food_items f
            JOIN restaurants r ON f.restaurant_id = r.restaurant_id
            WHERE 1=1
        `;
        const params = [];

        // Search filter (name or description)
        if (search && search.trim() !== '') {
            query += ' AND (f.name LIKE ? OR f.description LIKE ?)';
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm);
        }

        // Category filter
        if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
            query += ' AND f.category = ?';
            params.push(category.trim());
        }

        // Restaurant filter
        if (restaurant_id && restaurant_id !== 'all' && restaurant_id !== '') {
            query += ' AND f.restaurant_id = ?';
            params.push(parseInt(restaurant_id, 10));
        }

        // Availability filter
        if (available_only === 'true') {
            query += ' AND f.is_available = 1';
        }

        query += ' ORDER BY f.food_id ASC';

        const [foods] = await pool.query(query, params);

        res.json({
            success: true,
            count: foods.length,
            data: foods
        });
    } catch (err) {
        console.error('Error fetching foods:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve food items.' });
    }
});

// GET /api/foods/categories - List categories with item counts
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await pool.query(`
            SELECT category, COUNT(*) as count
            FROM food_items
            GROUP BY category
            ORDER BY category ASC
        `);
        res.json({ success: true, data: categories });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ success: false, message: 'Could not fetch categories.' });
    }
});

// GET /api/foods/:id - Single food details
router.get('/:id', async (req, res) => {
    try {
        const foodId = parseInt(req.params.id, 10);
        const [rows] = await pool.query(`
            SELECT f.*, r.name AS restaurant_name, r.cuisine AS restaurant_cuisine, r.address AS restaurant_address, r.rating AS restaurant_rating
            FROM food_items f
            JOIN restaurants r ON f.restaurant_id = r.restaurant_id
            WHERE f.food_id = ?
        `, [foodId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Food item not found.' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching food detail:', err);
        res.status(500).json({ success: false, message: 'Could not fetch food item.' });
    }
});

// POST /api/foods - Add new food item (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { restaurant_id, name, category, description, price, is_available, image_url } = req.body;

        if (!restaurant_id || !name || !category || !price) {
            return res.status(400).json({ success: false, message: 'Restaurant, name, category, and price are required.' });
        }

        const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
        const [result] = await pool.query(`
            INSERT INTO food_items (restaurant_id, name, category, description, price, is_available, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            parseInt(restaurant_id, 10),
            name.trim(),
            category.trim(),
            description ? description.trim() : '',
            parseFloat(price),
            is_available === false || is_available === 'false' || is_available === 0 ? 0 : 1,
            image_url || defaultImage
        ]);

        res.status(201).json({
            success: true,
            message: 'Food item added successfully.',
            food_id: result.insertId
        });
    } catch (err) {
        console.error('Error adding food item:', err);
        res.status(500).json({ success: false, message: 'Could not add food item.' });
    }
});

// PUT /api/foods/:id - Edit food item (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const foodId = parseInt(req.params.id, 10);
        const { restaurant_id, name, category, description, price, is_available, image_url } = req.body;

        if (!restaurant_id || !name || !category || !price) {
            return res.status(400).json({ success: false, message: 'Restaurant, name, category, and price are required.' });
        }

        const [result] = await pool.query(`
            UPDATE food_items
            SET restaurant_id = ?, name = ?, category = ?, description = ?, price = ?, is_available = ?, image_url = ?
            WHERE food_id = ?
        `, [
            parseInt(restaurant_id, 10),
            name.trim(),
            category.trim(),
            description ? description.trim() : '',
            parseFloat(price),
            is_available === false || is_available === 'false' || is_available === 0 ? 0 : 1,
            image_url,
            foodId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Food item not found.' });
        }

        res.json({ success: true, message: 'Food item updated successfully.' });
    } catch (err) {
        console.error('Error updating food item:', err);
        res.status(500).json({ success: false, message: 'Could not update food item.' });
    }
});

// PATCH /api/foods/:id/availability - Toggle availability (Admin only)
router.patch('/:id/availability', requireAdmin, async (req, res) => {
    try {
        const foodId = parseInt(req.params.id, 10);
        const { is_available } = req.body;

        const [result] = await pool.query(`
            UPDATE food_items SET is_available = ? WHERE food_id = ?
        `, [is_available ? 1 : 0, foodId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Food item not found.' });
        }

        res.json({ success: true, message: 'Availability status updated successfully.' });
    } catch (err) {
        console.error('Error toggling availability:', err);
        res.status(500).json({ success: false, message: 'Could not update status.' });
    }
});

// DELETE /api/foods/:id - Delete food item (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const foodId = parseInt(req.params.id, 10);
        const [result] = await pool.query('DELETE FROM food_items WHERE food_id = ?', [foodId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Food item not found.' });
        }

        res.json({ success: true, message: 'Food item deleted successfully.' });
    } catch (err) {
        console.error('Error deleting food item:', err);
        res.status(500).json({ success: false, message: 'Could not delete food item.' });
    }
});

module.exports = router;
