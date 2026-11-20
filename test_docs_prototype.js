const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 Starting Verification of GitHub Pages Frontend Prototype (docs/)...\n');

// Mock localStorage and window in a VM context
const localStorageStore = {};
const mockLocalStorage = {
    getItem: (key) => localStorageStore[key] || null,
    setItem: (key, val) => { localStorageStore[key] = String(val); },
    removeItem: (key) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const context = {
    console,
    localStorage: mockLocalStorage,
    window: {
        dispatchEvent: () => {},
        addEventListener: () => {}
    },
    document: {
        getElementById: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        createElement: () => ({
            id: '',
            className: '',
            style: {},
            insertAdjacentHTML: () => {},
            addEventListener: () => {},
            remove: () => {}
        }),
        body: {
            appendChild: () => {}
        }
    },
    bootstrap: {
        Toast: class {
            show() {}
        }
    },
    CustomEvent: class CustomEvent {},
    Date,
    Math,
    JSON,
    parseInt,
    parseFloat,
    Boolean
};

vm.createContext(context);

// Load data.js
const dataCode = fs.readFileSync(path.join(__dirname, 'docs', 'js', 'data.js'), 'utf8');
vm.runInContext(dataCode, context);

// Load storage.js
const storageCode = fs.readFileSync(path.join(__dirname, 'docs', 'js', 'storage.js'), 'utf8');
vm.runInContext(storageCode, context);

// Load cart.js
const cartCode = fs.readFileSync(path.join(__dirname, 'docs', 'js', 'cart.js'), 'utf8');
vm.runInContext(cartCode, context);

const StorageService = context.window.StorageService;
const Cart = context.window.Cart;

// TEST 1: StorageService initialization
console.log('1. Testing Storage Initialization...');
StorageService.init();
const foods = StorageService.getFoods();
const restaurants = StorageService.getRestaurants();
const customers = StorageService.getCustomers();
const orders = StorageService.getOrders();

console.log(`   ✅ Loaded ${foods.length} Food Items across all categories`);
console.log(`   ✅ Loaded ${restaurants.length} Partner Kitchens`);
console.log(`   ✅ Loaded ${customers.length} Default Customers`);
console.log(`   ✅ Loaded ${orders.length} Sample Orders`);

if (foods.length !== 24 || restaurants.length !== 6) {
    throw new Error('Initial seed data mismatch');
}

// TEST 2: Search and Category Filtering
console.log('\n2. Testing Food Filtering and Search...');
const southIndian = StorageService.getFoods({ category: 'South Indian' });
console.log(`   ✅ Category Filter (South Indian): ${southIndian.length} items`);
if (southIndian.length === 0 || !southIndian.every(f => f.category === 'South Indian')) {
    throw new Error('Category filter failed');
}

const searchResult = StorageService.getFoods({ search: 'pizza' });
console.log(`   ✅ Search Query ("pizza"): ${searchResult.length} items found`);
if (searchResult.length === 0) {
    throw new Error('Search failed');
}

// TEST 3: Customer Registration & Login
console.log('\n3. Testing Customer Registration & Login...');
const regRes = StorageService.registerCustomer({
    name: 'Priya Patel',
    email: 'priya.patel@gmail.com',
    phone: '9876501234',
    address: 'B-12, Green Glen Layout, Bellandur',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560103',
    password: 'Password@123'
});
console.log('   ✅ Registered customer:', regRes.customer.name, `(#${regRes.customer.customer_id})`);

const dupRes = StorageService.registerCustomer({
    name: 'Priya Duplicate',
    email: 'priya.patel@gmail.com',
    phone: '9876501234',
    address: 'Anywhere',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560103',
    password: 'Password@123'
});
if (!dupRes.success) {
    console.log('   ✅ Duplicate email prevented:', dupRes.message);
} else {
    throw new Error('Duplicate check failed');
}

const loginRes = StorageService.loginCustomer('priya.patel@gmail.com', 'Password@123');
if (loginRes.success && loginRes.customer.name === 'Priya Patel') {
    console.log('   ✅ Logged in successfully:', loginRes.customer.email);
} else {
    throw new Error('Login failed');
}

// TEST 4: Cart Operations
console.log('\n4. Testing Cart Functionality in localStorage...');
Cart.addItem(foods[0], 2);
Cart.addItem(foods[4], 1);
let cartItems = Cart.getItems();
let summary = Cart.getSummary();
console.log(`   ✅ Cart has ${cartItems.length} distinct items, Total Quantity: ${summary.itemCount}`);
console.log(`   ✅ Subtotal: ₹${summary.subtotal}, Delivery Fee: ₹${summary.deliveryFee}, Tax: ₹${summary.tax}, Grand Total: ₹${summary.total}`);

if (summary.itemCount !== 3 || summary.deliveryFee !== 40) {
    throw new Error('Cart calculation error');
}

// TEST 5: Order Placement via StorageService
console.log('\n5. Testing Checkout & Order Placement...');
const orderRes = StorageService.placeOrder({
    customer_name: 'Priya Patel',
    delivery_phone: '9876501234',
    delivery_address: 'B-12, Green Glen Layout, Bellandur',
    delivery_city: 'Bangalore',
    delivery_state: 'Karnataka',
    delivery_pincode: '560103',
    special_instructions: 'No plastic cutlery',
    payment_method: 'UPI (GPay / PhonePe / Paytm)',
    items: cartItems
});

if (orderRes.success && orderRes.order) {
    console.log(`   ✅ Order #${orderRes.order.order_id} placed successfully with total ₹${orderRes.order.total_amount}`);
    console.log(`   ✅ Status: ${orderRes.order.status}, Items: ${orderRes.order.items.length}`);
} else {
    throw new Error('Order placement failed');
}

// Clear cart
Cart.clear();
if (Cart.getItems().length === 0) {
    console.log('   ✅ Cart cleared after order placement');
}

// TEST 6: Order History & Cancellation
console.log('\n6. Testing Order History & Order Cancellation...');
const priyaOrders = StorageService.getCustomerOrders(loginRes.customer.customer_id);
console.log(`   ✅ Retrieved ${priyaOrders.length} order(s) for customer Priya Patel`);

const cancelRes = StorageService.cancelOrder(orderRes.order.order_id);
if (cancelRes.success && cancelRes.order.status === 'Cancelled') {
    console.log(`   ✅ Cancelled Order #${orderRes.order.order_id} successfully: Status is now "${cancelRes.order.status}"`);
} else {
    throw new Error('Cancel order failed');
}

// TEST 7: Admin Dashboard Operations
console.log('\n7. Testing Admin Dashboard Operations...');
const adminAuth = StorageService.adminLogin('admin', 'admin123');
if (adminAuth.success) {
    console.log('   ✅ Admin authenticated successfully (admin / admin123)');
} else {
    throw new Error('Admin auth failed');
}

const stats = StorageService.getAdminStats();
console.log(`   ✅ Admin Stats: Total Orders=${stats.total_orders}, Revenue=₹${stats.total_revenue}, Foods=${stats.total_foods}, Customers=${stats.total_customers}, Kitchens=${stats.total_restaurants}`);

// Add new food
StorageService.saveFood({
    restaurant_id: 1,
    name: 'Special Kerala Appam with Stew',
    category: 'South Indian',
    description: 'Lacy rice pancakes served with mildly spiced coconut milk vegetable stew.',
    price: 150.00,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
});
const updatedFoods = StorageService.getFoods();
console.log(`   ✅ Created new food item in localStorage: Total Foods now ${updatedFoods.length}`);

// TEST 8: Verify HTML Asset Links
console.log('\n8. Verifying HTML Documents and Asset Links...');
const pages = ['index.html', 'my-orders.html', 'admin.html'];
for (const p of pages) {
    const html = fs.readFileSync(path.join(__dirname, 'docs', p), 'utf8');
    if (html.includes('css/style.css') && html.includes('js/data.js') && html.includes('js/storage.js')) {
        console.log(`   ✅ docs/${p} includes all necessary relative CSS and script tags`);
    } else {
        throw new Error(`docs/${p} missing required relative asset tags`);
    }

    if (html.includes('href="/') || html.includes('src="/')) {
        throw new Error(`docs/${p} contains broken absolute links starting with "/"`);
    }
}

console.log('\n🎉 ALL 8 FRONTEND PROTOTYPE TESTS PASSED WITH 100% SUCCESS!');
