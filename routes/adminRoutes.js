const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// Middleware to verify admin session
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.admin) {
        return res.status(401).json({ success: false, message: 'Admin authentication required.' });
    }
    next();
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? OR email = ?', [username.trim(), username.trim()]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
        }

        req.session.admin = {
            admin_id: admin.admin_id,
            username: admin.username,
            email: admin.email,
            role: admin.role
        };

        res.json({
            success: true,
            message: `Welcome Admin, ${admin.username}!`,
            admin: req.session.admin
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ success: false, message: 'Server error during admin login.' });
    }
});

// GET /api/admin/check
router.get('/check', (req, res) => {
    if (req.session && req.session.admin) {
        return res.json({ success: true, admin: req.session.admin });
    }
    res.json({ success: false, admin: null });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
    req.session.admin = null;
    res.json({ success: true, message: 'Admin logged out successfully.' });
});

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
    try {
        const [ordersCount] = await pool.query('SELECT COUNT(*) AS total_orders FROM orders');
        const [revenue] = await pool.query('SELECT IFNULL(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status != "Cancelled"');
        const [foodsCount] = await pool.query('SELECT COUNT(*) AS total_foods FROM food_items');
        const [customersCount] = await pool.query('SELECT COUNT(*) AS total_customers FROM customers');
        const [restaurantsCount] = await pool.query('SELECT COUNT(*) AS total_restaurants FROM restaurants');

        // Status counts
        const [statusCounts] = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM orders
            GROUP BY status
        `);

        // Recent 5 orders
        const [recentOrders] = await pool.query(`
            SELECT order_id, customer_name, total_amount, status, payment_method, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            stats: {
                total_orders: ordersCount[0].total_orders,
                total_revenue: parseFloat(revenue[0].total_revenue),
                total_foods: foodsCount[0].total_foods,
                total_customers: customersCount[0].total_customers,
                total_restaurants: restaurantsCount[0].total_restaurants,
                status_breakdown: statusCounts,
                recent_orders: recentOrders
            }
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
    }
});

// GET /api/admin/orders - All orders with details
router.get('/orders', requireAdmin, async (req, res) => {
    try {
        const [orders] = await pool.query(`
            SELECT o.*, c.email AS customer_email
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.created_at DESC
        `);

        for (const order of orders) {
            const [items] = await pool.query(`
                SELECT oi.*, f.image_url
                FROM order_items oi
                LEFT JOIN food_items f ON oi.food_id = f.food_id
                WHERE oi.order_id = ?
            `, [order.order_id]);
            order.items = items;
        }

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('Error fetching all orders:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
    }
});

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        const { status } = req.body;

        const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const [result] = await pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        res.json({
            success: true,
            message: `Order #${orderId} status updated to "${status}".`,
            status
        });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ success: false, message: 'Failed to update order status.' });
    }
});

// GET /api/admin/customers - View registered customers
router.get('/customers', requireAdmin, async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT c.customer_id, c.name, c.email, c.phone, c.address, c.city, c.state, c.pincode, c.created_at,
                   COUNT(o.order_id) AS total_orders,
                   IFNULL(SUM(CASE WHEN o.status != 'Cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spent
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id
            GROUP BY c.customer_id
            ORDER BY c.created_at DESC
        `);

        res.json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
    }
});

module.exports = router;
