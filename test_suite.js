const http = require('http');

async function runTests() {
    console.log('🧪 Starting FoodieHub Comprehensive System Tests...\n');

    let cookieHeader = '';
    let adminCookieHeader = '';
    let testOrderId = null;
    let newFoodId = null;

    function req(path, method = 'GET', body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, 'http://localhost:3000');
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            const clientReq = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const setCookie = res.headers['set-cookie'];
                    let parsedData;
                    try {
                        parsedData = JSON.parse(data);
                    } catch (e) {
                        parsedData = data;
                    }
                    resolve({ status: res.statusCode, headers: res.headers, setCookie, data: parsedData });
                });
            });

            clientReq.on('error', reject);
            if (body) {
                clientReq.write(typeof body === 'string' ? body : JSON.stringify(body));
            }
            clientReq.end();
        });
    }

    // TEST 1: Homepage delivery
    console.log('1. Testing Homepage Route (GET /)...');
    const homeRes = await req('/');
    if (homeRes.status === 200 && typeof homeRes.data === 'string' && homeRes.data.includes('FoodieHub')) {
        console.log('   ✅ Homepage loaded successfully (Status 200, contains FoodieHub branding)');
    } else {
        throw new Error('Homepage failed: ' + homeRes.status);
    }

    // TEST 2: Food Retrieval & Filtering
    console.log('\n2. Testing Food Retrieval API (GET /api/foods)...');
    const allFoodsRes = await req('/api/foods');
    if (allFoodsRes.status === 200 && allFoodsRes.data.success && allFoodsRes.data.data.length >= 24) {
        console.log(`   ✅ Retrieved ${allFoodsRes.data.data.length} food items from MySQL`);
    } else {
        throw new Error('Food retrieval failed');
    }

    // Test Category Filter
    const catRes = await req('/api/foods?category=South%20Indian');
    if (catRes.status === 200 && catRes.data.data.every(f => f.category === 'South Indian')) {
        console.log(`   ✅ Category filter works: ${catRes.data.data.length} South Indian dishes retrieved`);
    } else {
        throw new Error('Category filter failed');
    }

    // Test Search
    const searchRes = await req('/api/foods?search=Dosa');
    if (searchRes.status === 200 && searchRes.data.data.length > 0) {
        console.log(`   ✅ Search filter works: "${searchRes.data.data[0].name}" found for query "Dosa"`);
    } else {
        throw new Error('Search filter failed');
    }

    // TEST 3: Customer Registration & Auth
    console.log('\n3. Testing Customer Registration & Session...');
    const testEmail = `rahul.test${Date.now()}@gmail.com`;
    const regRes = await req('/api/auth/register', 'POST', {
        name: 'Rahul Sharma',
        email: testEmail,
        phone: '9876543210',
        address: 'Flat 402, Sunshine Heights, 3rd Cross',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560103',
        password: 'Password@123'
    });

    if (regRes.status === 201 && regRes.data.success) {
        console.log('   ✅ Customer registered successfully in MySQL:', regRes.data.customer.email);
        if (regRes.setCookie) {
            cookieHeader = regRes.setCookie.map(c => c.split(';')[0]).join('; ');
        }
    } else {
        throw new Error('Registration failed: ' + JSON.stringify(regRes.data));
    }

    // Verify Session Current Customer
    const sessionRes = await req('/api/auth/current', 'GET', null, { 'Cookie': cookieHeader });
    if (sessionRes.status === 200 && sessionRes.data.customer && sessionRes.data.customer.email === testEmail) {
        console.log('   ✅ Active session verified for customer:', sessionRes.data.customer.name);
    } else {
        throw new Error('Session check failed');
    }

    // TEST 4: Order Creation with MySQL Transaction
    console.log('\n4. Testing Order Creation with MySQL Transaction...');
    const orderPayload = {
        customer_name: 'Rahul Sharma',
        delivery_phone: '9876543210',
        delivery_address: 'Flat 402, Sunshine Heights, 3rd Cross',
        delivery_city: 'Bangalore',
        delivery_state: 'Karnataka',
        delivery_pincode: '560103',
        special_instructions: 'Ring the doorbell twice',
        payment_method: 'Cash on Delivery',
        items: [
            { food_id: 1, quantity: 2 },
            { food_id: 2, quantity: 1 }
        ]
    };

    const orderRes = await req('/api/orders', 'POST', orderPayload, { 'Cookie': cookieHeader });
    if (orderRes.status === 201 && orderRes.data.success && orderRes.data.order_id) {
        testOrderId = orderRes.data.order_id;
        console.log(`   ✅ Transaction committed! Order #${testOrderId} created with Total: ₹${orderRes.data.total_amount}`);
        console.log(`      Subtotal: ₹${orderRes.data.subtotal}, Delivery: ₹${orderRes.data.delivery_fee}, Tax: ₹${orderRes.data.tax}`);
    } else {
        throw new Error('Order creation failed: ' + JSON.stringify(orderRes.data));
    }

    // TEST 5: Customer My Orders
    console.log('\n5. Testing Customer Order Retrieval (GET /api/orders/my-orders)...');
    const myOrdersRes = await req('/api/orders/my-orders', 'GET', null, { 'Cookie': cookieHeader });
    if (myOrdersRes.status === 200 && myOrdersRes.data.orders.length > 0) {
        const foundOrder = myOrdersRes.data.orders.find(o => o.order_id === testOrderId);
        console.log(`   ✅ Found Order #${foundOrder.order_id} with ${foundOrder.items.length} items for logged in customer`);
    } else {
        throw new Error('My Orders fetch failed');
    }

    // TEST 6: Admin Login & Dashboard Stats
    console.log('\n6. Testing Admin Login & Dashboard Stats...');
    const adminLoginRes = await req('/api/admin/login', 'POST', {
        username: 'admin',
        password: 'admin123'
    });

    if (adminLoginRes.status === 200 && adminLoginRes.data.success) {
        console.log('   ✅ Admin authenticated successfully:', adminLoginRes.data.admin.username);
        if (adminLoginRes.setCookie) {
            adminCookieHeader = adminLoginRes.setCookie.map(c => c.split(';')[0]).join('; ');
        }
    } else {
        throw new Error('Admin login failed: ' + JSON.stringify(adminLoginRes.data));
    }

    const statsRes = await req('/api/admin/dashboard-stats', 'GET', null, { 'Cookie': adminCookieHeader });
    if (statsRes.status === 200 && statsRes.data.success) {
        const s = statsRes.data.stats;
        console.log(`   ✅ Admin Stats: Orders=${s.total_orders}, Revenue=₹${s.total_revenue}, Foods=${s.total_foods}, Customers=${s.total_customers}, Kitchens=${s.total_restaurants}`);
    } else {
        throw new Error('Admin stats failed');
    }

    // TEST 7: Admin Order Status Update
    console.log('\n7. Testing Order Status Update (PATCH /api/admin/orders/:id/status)...');
    const statusUpdateRes = await req(`/api/admin/orders/${testOrderId}/status`, 'PATCH', {
        status: 'Preparing'
    }, { 'Cookie': adminCookieHeader });

    if (statusUpdateRes.status === 200 && statusUpdateRes.data.success) {
        console.log(`   ✅ Order #${testOrderId} status updated to "Preparing"`);
    } else {
        throw new Error('Order status update failed');
    }

    // TEST 8: Admin Food CRUD
    console.log('\n8. Testing Admin Food Management (Add, Edit, Availability, Delete)...');
    const newFoodRes = await req('/api/foods', 'POST', {
        restaurant_id: 1,
        name: 'Special Malabar Parotta & Kurma',
        category: 'South Indian',
        description: 'Layered flaky Kerala parottas served with rich aromatic vegetable coconut kurma.',
        price: 130.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
    }, { 'Cookie': adminCookieHeader });

    if (newFoodRes.status === 201 && newFoodRes.data.success) {
        newFoodId = newFoodRes.data.food_id;
        console.log(`   ✅ Created new food item #${newFoodId}`);
    } else {
        throw new Error('Food creation failed: ' + JSON.stringify(newFoodRes.data));
    }

    // Toggle Availability
    const toggleRes = await req(`/api/foods/${newFoodId}/availability`, 'PATCH', { is_available: false }, { 'Cookie': adminCookieHeader });
    if (toggleRes.status === 200 && toggleRes.data.success) {
        console.log(`   ✅ Toggled availability for Food #${newFoodId} to unavailable`);
    }

    // Delete Food
    const delRes = await req(`/api/foods/${newFoodId}`, 'DELETE', null, { 'Cookie': adminCookieHeader });
    if (delRes.status === 200 && delRes.data.success) {
        console.log(`   ✅ Deleted Food item #${newFoodId}`);
    }

    // TEST 9: Admin Customers Directory
    console.log('\n9. Testing Admin Customers Directory...');
    const custRes = await req('/api/admin/customers', 'GET', null, { 'Cookie': adminCookieHeader });
    if (custRes.status === 200 && custRes.data.success && custRes.data.customers.length > 0) {
        const found = custRes.data.customers.find(c => c.email === testEmail);
        console.log(`   ✅ Customer Directory lists registered customer "${found.name}" with ${found.total_orders} order(s)`);
    } else {
        throw new Error('Customers directory failed');
    }

    // TEST 10: Contact Us Endpoint
    console.log('\n10. Testing Contact Us Form Submission...');
    const contactRes = await req('/api/contact', 'POST', {
        name: 'Sivanesh E',
        email: 'sivaneshe7@outlook.com',
        subject: 'Inquiry on Partnering',
        message: 'Looking to partner our cafe on FoodieHub!'
    });
    if (contactRes.status === 200 && contactRes.data.success) {
        console.log('   ✅ Contact submission successful:', contactRes.data.message);
    } else {
        throw new Error('Contact failed');
    }

    console.log('\n🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY WITH 100% SUCCESS RATE!');
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
