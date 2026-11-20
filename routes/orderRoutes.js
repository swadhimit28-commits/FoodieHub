const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Middleware to verify customer
function requireCustomer(req, res, next) {
    if (!req.session || !req.session.customer) {
        return res.status(401).json({ success: false, message: 'Please log in to manage orders.' });
    }
    next();
}

// POST /api/orders - Place a new order using MySQL Transactions
router.post('/', async (req, res) => {
    let connection;
    try {
        const {
            customer_name,
            delivery_phone,
            delivery_address,
            delivery_city,
            delivery_state,
            delivery_pincode,
            special_instructions,
            payment_method,
            items
        } = req.body;

        // Ensure customer is logged in
        let customerId;
        if (req.session && req.session.customer) {
            customerId = req.session.customer.customer_id;
        } else {
            return res.status(401).json({ success: false, message: 'Please log in or register to place your order.' });
        }

        // Validate required fields
        if (!customer_name || !delivery_phone || !delivery_address || !delivery_city || !delivery_state || !delivery_pincode) {
            return res.status(400).json({ success: false, message: 'All delivery details are required.' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items before placing order.' });
        }

        // Acquire dedicated connection from pool for transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let calculatedSubtotal = 0;
        const verifiedItems = [];

        // Verify items against database prices and availability
        for (const item of items) {
            const foodId = parseInt(item.food_id, 10);
            const qty = parseInt(item.quantity, 10);

            if (!foodId || !qty || qty <= 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ success: false, message: 'Invalid item or quantity in order.' });
            }

            const [foodRows] = await connection.query(
                'SELECT food_id, name, price, is_available FROM food_items WHERE food_id = ? FOR UPDATE',
                [foodId]
            );

            if (foodRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ success: false, message: `Item ID ${foodId} not found.` });
            }

            const food = foodRows[0];
            if (!food.is_available) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ success: false, message: `"${food.name}" is currently unavailable.` });
            }

            const itemPrice = parseFloat(food.price);
            const itemSubtotal = itemPrice * qty;
            calculatedSubtotal += itemSubtotal;

            verifiedItems.push({
                food_id: food.food_id,
                food_name: food.name,
                price: itemPrice,
                quantity: qty,
                subtotal: itemSubtotal
            });
        }

        const deliveryFee = 40.00;
        const taxRate = 0.05; // 5% GST
        const calculatedTax = parseFloat((calculatedSubtotal * taxRate).toFixed(2));
        const calculatedTotal = parseFloat((calculatedSubtotal + deliveryFee + calculatedTax).toFixed(2));

        // Insert into orders table
        const [orderResult] = await connection.query(`
            INSERT INTO orders (
                customer_id, customer_name, delivery_phone, delivery_address,
                delivery_city, delivery_state, delivery_pincode, special_instructions,
                payment_method, subtotal, delivery_fee, tax, total_amount, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [
            customerId,
            customer_name.trim(),
            delivery_phone.trim(),
            delivery_address.trim(),
            delivery_city.trim(),
            delivery_state.trim(),
            delivery_pincode.trim(),
            special_instructions ? special_instructions.trim() : '',
            payment_method || 'Cash on Delivery',
            calculatedSubtotal,
            deliveryFee,
            calculatedTax,
            calculatedTotal
        ]);

        const orderId = orderResult.insertId;

        // Insert into order_items table
        for (const vi of verifiedItems) {
            await connection.query(`
                INSERT INTO order_items (order_id, food_id, food_name, price, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [orderId, vi.food_id, vi.food_name, vi.price, vi.quantity, vi.subtotal]);
        }

        // Commit transaction
        await connection.commit();
        connection.release();

        res.status(201).json({
            success: true,
            message: '🎉 Order placed successfully! Your food is being prepared.',
            order_id: orderId,
            total_amount: calculatedTotal,
            subtotal: calculatedSubtotal,
            delivery_fee: deliveryFee,
            tax: calculatedTax,
            payment_method: payment_method || 'Cash on Delivery',
            status: 'Pending',
            items: verifiedItems
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error('Order creation error:', err);
        res.status(500).json({ success: false, message: 'Failed to process order. Please try again.' });
    }
});

// GET /api/orders/my-orders - Retrieve all orders for logged-in customer
router.get('/my-orders', requireCustomer, async (req, res) => {
    try {
        const customerId = req.session.customer.customer_id;

        const [orders] = await pool.query(`
            SELECT * FROM orders
            WHERE customer_id = ?
            ORDER BY created_at DESC
        `, [customerId]);

        // Fetch items for each order
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
        console.error('Error fetching customer orders:', err);
        res.status(500).json({ success: false, message: 'Could not fetch your orders.' });
    }
});

// GET /api/orders - All accessible orders
router.get('/', async (req, res) => {
    try {
        let orders;
        if (req.session?.admin) {
            [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        } else if (req.session?.customer) {
            [orders] = await pool.query(
                'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
                [req.session.customer.customer_id]
            );
        } else {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        for (const order of orders) {
            const [items] = await pool.query(
                'SELECT oi.*, f.image_url FROM order_items oi LEFT JOIN food_items f ON oi.food_id = f.food_id WHERE oi.order_id = ?',
                [order.order_id]
            );
            order.items = items;
        }
        res.json({ success: true, count: orders.length, orders });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ success: false, message: 'Could not fetch orders.' });
    }
});

// PUT /api/orders/:id - Update an eligible Pending order
router.put('/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        const [rows] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const order = rows[0];
        const isOwner = req.session?.customer?.customer_id === order.customer_id;
        const isAdmin = Boolean(req.session?.admin);
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        if (order.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Only Pending orders can be updated.' });
        }

        const {
            customer_name,
            delivery_phone,
            delivery_address,
            delivery_city,
            delivery_state,
            delivery_pincode,
            special_instructions,
            payment_method
        } = req.body;
        if (!customer_name || !delivery_phone || !delivery_address || !delivery_city || !delivery_state || !delivery_pincode) {
            return res.status(400).json({ success: false, message: 'All delivery details are required.' });
        }

        await pool.query(`
            UPDATE orders
            SET customer_name = ?, delivery_phone = ?, delivery_address = ?, delivery_city = ?,
                delivery_state = ?, delivery_pincode = ?, special_instructions = ?, payment_method = ?
            WHERE order_id = ?
        `, [
            customer_name.trim(),
            delivery_phone.trim(),
            delivery_address.trim(),
            delivery_city.trim(),
            delivery_state.trim(),
            delivery_pincode.trim(),
            special_instructions ? special_instructions.trim() : '',
            payment_method || 'Cash on Delivery',
            orderId
        ]);
        res.json({ success: true, message: 'Order updated successfully.' });
    } catch (err) {
        console.error('Error updating order:', err);
        res.status(500).json({ success: false, message: 'Could not update order.' });
    }
});

// GET /api/orders/:id - Single order details
router.get('/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);

        const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (orderRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const order = orderRows[0];

        // Security check: If not admin and not the customer who owns it
        if (!req.session || (!req.session.admin && (!req.session.customer || req.session.customer.customer_id !== order.customer_id))) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const [items] = await pool.query(`
            SELECT oi.*, f.image_url
            FROM order_items oi
            LEFT JOIN food_items f ON oi.food_id = f.food_id
            WHERE oi.order_id = ?
        `, [orderId]);

        order.items = items;

        res.json({ success: true, order });
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ success: false, message: 'Could not fetch order details.' });
    }
});

// PATCH /api/orders/:id/cancel - Cancel eligible order (only if status is 'Pending')
router.patch('/:id/cancel', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);

        const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (orderRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const order = orderRows[0];

        // Security check
        const isCustomerOwner = req.session && req.session.customer && req.session.customer.customer_id === order.customer_id;
        const isAdmin = req.session && req.session.admin;

        if (!isCustomerOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order.' });
        }

        if (order.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order with status "${order.status}". Only Pending orders can be cancelled.`
            });
        }

        await pool.query('UPDATE orders SET status = "Cancelled" WHERE order_id = ?', [orderId]);

        res.json({
            success: true,
            message: 'Order cancelled successfully.',
            status: 'Cancelled'
        });
    } catch (err) {
        console.error('Error cancelling order:', err);
        res.status(500).json({ success: false, message: 'Could not cancel order.' });
    }
});

module.exports = router;
