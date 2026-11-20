/* ========================================================
   FOODIEHUB - FRONTEND STORAGE SERVICE (FOR GITHUB PAGES)
   Complete mock backend implemented with localStorage.
======================================================== */

const StorageKeys = {
    FOODS: 'foodiehub_demo_foods',
    RESTAURANTS: 'foodiehub_demo_restaurants',
    CUSTOMERS: 'foodiehub_demo_customers',
    ORDERS: 'foodiehub_demo_orders',
    CURRENT_USER: 'foodiehub_demo_current_user',
    ADMIN_SESSION: 'foodiehub_demo_admin_session'
};

const StorageService = {
    // Initialize default data if not present
    init() {
        if (!localStorage.getItem(StorageKeys.RESTAURANTS)) {
            localStorage.setItem(StorageKeys.RESTAURANTS, JSON.stringify(INITIAL_RESTAURANTS));
        }
        if (!localStorage.getItem(StorageKeys.FOODS)) {
            localStorage.setItem(StorageKeys.FOODS, JSON.stringify(INITIAL_FOODS));
        }
        if (!localStorage.getItem(StorageKeys.CUSTOMERS)) {
            localStorage.setItem(StorageKeys.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
        }
        if (!localStorage.getItem(StorageKeys.ORDERS)) {
            localStorage.setItem(StorageKeys.ORDERS, JSON.stringify(INITIAL_ORDERS));
        }
        // Auto-login default demo user for convenience if none set
        if (!localStorage.getItem(StorageKeys.CURRENT_USER)) {
            localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(INITIAL_CUSTOMERS[0]));
        }
    },

    // ----------------------------------------------------
    // RESTAURANTS
    // ----------------------------------------------------
    getRestaurants() {
        this.init();
        const restaurants = JSON.parse(localStorage.getItem(StorageKeys.RESTAURANTS) || '[]');
        const foods = JSON.parse(localStorage.getItem(StorageKeys.FOODS) || '[]');

        // Attach dynamic total_items count
        return restaurants.map(r => {
            const count = foods.filter(f => f.restaurant_id === r.restaurant_id).length;
            return { ...r, total_items: count };
        });
    },

    getRestaurantById(id) {
        const restaurants = this.getRestaurants();
        return restaurants.find(r => r.restaurant_id === parseInt(id, 10)) || null;
    },

    saveRestaurant(data) {
        let restaurants = this.getRestaurants();
        if (data.restaurant_id) {
            // Edit
            const id = parseInt(data.restaurant_id, 10);
            restaurants = restaurants.map(r => r.restaurant_id === id ? { ...r, ...data, restaurant_id: id } : r);
        } else {
            // New
            const newId = restaurants.length > 0 ? Math.max(...restaurants.map(r => r.restaurant_id)) + 1 : 1;
            restaurants.push({
                restaurant_id: newId,
                name: data.name,
                cuisine: data.cuisine,
                rating: parseFloat(data.rating) || 4.5,
                image_url: data.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
                address: data.address
            });
        }
        localStorage.setItem(StorageKeys.RESTAURANTS, JSON.stringify(restaurants));
        return true;
    },

    deleteRestaurant(id) {
        const restId = parseInt(id, 10);
        let restaurants = this.getRestaurants();
        restaurants = restaurants.filter(r => r.restaurant_id !== restId);
        localStorage.setItem(StorageKeys.RESTAURANTS, JSON.stringify(restaurants));

        // Cascade delete foods
        let foods = this.getFoods();
        foods = foods.filter(f => f.restaurant_id !== restId);
        localStorage.setItem(StorageKeys.FOODS, JSON.stringify(foods));
        return true;
    },

    // ----------------------------------------------------
    // FOODS
    // ----------------------------------------------------
    getFoods(filterParams = {}) {
        this.init();
        let foods = JSON.parse(localStorage.getItem(StorageKeys.FOODS) || '[]');
        const restaurants = JSON.parse(localStorage.getItem(StorageKeys.RESTAURANTS) || '[]');

        // Enrich with restaurant details if missing
        foods = foods.map(f => {
            const r = restaurants.find(res => res.restaurant_id === f.restaurant_id);
            return {
                ...f,
                restaurant_name: f.restaurant_name || (r ? r.name : 'Partner Kitchen'),
                restaurant_cuisine: f.restaurant_cuisine || (r ? r.cuisine : 'Multi-cuisine'),
                restaurant_rating: f.restaurant_rating || (r ? r.rating : 4.5),
                restaurant_address: f.restaurant_address || (r ? r.address : 'Central Delivery Kitchen')
            };
        });

        // Filter: Category
        if (filterParams.category && filterParams.category !== 'all') {
            foods = foods.filter(f => f.category.toLowerCase() === filterParams.category.toLowerCase());
        }

        // Filter: Restaurant
        if (filterParams.restaurant_id && filterParams.restaurant_id !== 'all') {
            const rId = parseInt(filterParams.restaurant_id, 10);
            foods = foods.filter(f => f.restaurant_id === rId);
        }

        // Filter: Search keyword
        if (filterParams.search && filterParams.search.trim() !== '') {
            const q = filterParams.search.toLowerCase().trim();
            foods = foods.filter(f =>
                f.name.toLowerCase().includes(q) ||
                (f.description && f.description.toLowerCase().includes(q)) ||
                (f.category && f.category.toLowerCase().includes(q))
            );
        }

        return foods;
    },

    getFoodById(id) {
        const foods = this.getFoods();
        return foods.find(f => f.food_id === parseInt(id, 10)) || null;
    },

    saveFood(data) {
        let foods = this.getFoods();
        const restaurants = this.getRestaurants();
        const rId = parseInt(data.restaurant_id, 10);
        const r = restaurants.find(x => x.restaurant_id === rId);

        if (data.food_id) {
            // Edit
            const id = parseInt(data.food_id, 10);
            foods = foods.map(f => {
                if (f.food_id === id) {
                    return {
                        ...f,
                        restaurant_id: rId,
                        restaurant_name: r ? r.name : f.restaurant_name,
                        restaurant_cuisine: r ? r.cuisine : f.restaurant_cuisine,
                        restaurant_rating: r ? r.rating : f.restaurant_rating,
                        name: data.name,
                        category: data.category,
                        description: data.description,
                        price: parseFloat(data.price),
                        is_available: data.is_available,
                        image_url: data.image_url
                    };
                }
                return f;
            });
        } else {
            // Add new
            const newId = foods.length > 0 ? Math.max(...foods.map(f => f.food_id)) + 1 : 1;
            foods.push({
                food_id: newId,
                restaurant_id: rId,
                restaurant_name: r ? r.name : 'Partner Kitchen',
                restaurant_cuisine: r ? r.cuisine : 'Multi-cuisine',
                restaurant_rating: r ? r.rating : 4.5,
                name: data.name,
                category: data.category,
                description: data.description,
                price: parseFloat(data.price),
                is_available: data.is_available !== false,
                image_url: data.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
            });
        }
        localStorage.setItem(StorageKeys.FOODS, JSON.stringify(foods));
        return true;
    },

    toggleFoodAvailability(id, isAvailable) {
        const foodId = parseInt(id, 10);
        let foods = this.getFoods();
        foods = foods.map(f => f.food_id === foodId ? { ...f, is_available: isAvailable } : f);
        localStorage.setItem(StorageKeys.FOODS, JSON.stringify(foods));
        return true;
    },

    deleteFood(id) {
        const foodId = parseInt(id, 10);
        let foods = this.getFoods();
        foods = foods.filter(f => f.food_id !== foodId);
        localStorage.setItem(StorageKeys.FOODS, JSON.stringify(foods));
        return true;
    },

    // ----------------------------------------------------
    // CUSTOMER AUTHENTICATION (LOCALSTORAGE)
    // ----------------------------------------------------
    getCustomers() {
        this.init();
        return JSON.parse(localStorage.getItem(StorageKeys.CUSTOMERS) || '[]');
    },

    getCurrentCustomer() {
        this.init();
        const raw = localStorage.getItem(StorageKeys.CURRENT_USER);
        return raw ? JSON.parse(raw) : null;
    },

    registerCustomer(customerData) {
        const customers = this.getCustomers();
        const normalizedEmail = customerData.email.trim().toLowerCase();

        // Check duplicate
        if (customers.some(c => c.email.toLowerCase() === normalizedEmail)) {
            return { success: false, message: 'An account with this email already exists. Please log in.' };
        }

        const newId = customers.length > 0 ? Math.max(...customers.map(c => c.customer_id)) + 1 : 1;
        const newCustomer = {
            customer_id: newId,
            name: customerData.name.trim(),
            email: normalizedEmail,
            phone: customerData.phone.trim(),
            address: customerData.address.trim(),
            city: customerData.city.trim(),
            state: customerData.state.trim(),
            pincode: customerData.pincode.trim(),
            password: customerData.password,
            created_at: new Date().toISOString()
        };

        customers.push(newCustomer);
        localStorage.setItem(StorageKeys.CUSTOMERS, JSON.stringify(customers));
        localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(newCustomer));

        return { success: true, message: 'Registration successful! Welcome to FoodieHub.', customer: newCustomer };
    },

    loginCustomer(email, password) {
        const customers = this.getCustomers();
        const normalizedEmail = email.trim().toLowerCase();
        const user = customers.find(c => c.email.toLowerCase() === normalizedEmail && c.password === password);

        if (!user) {
            return { success: false, message: 'Invalid email or password.' };
        }

        localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(user));
        return { success: true, message: `Welcome back, ${user.name}!`, customer: user };
    },

    logoutCustomer() {
        localStorage.removeItem(StorageKeys.CURRENT_USER);
        return { success: true, message: 'Logged out successfully.' };
    },

    // ----------------------------------------------------
    // ORDERS & CHECKOUT (LOCALSTORAGE)
    // ----------------------------------------------------
    getOrders() {
        this.init();
        return JSON.parse(localStorage.getItem(StorageKeys.ORDERS) || '[]');
    },

    getCustomerOrders(customerId) {
        const orders = this.getOrders();
        return orders.filter(o => o.customer_id === parseInt(customerId, 10)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getOrderById(id) {
        const orders = this.getOrders();
        return orders.find(o => o.order_id === parseInt(id, 10)) || null;
    },

    placeOrder(orderData) {
        const orders = this.getOrders();
        const currentUser = this.getCurrentCustomer();

        const newId = orders.length > 0 ? Math.max(...orders.map(o => o.order_id)) + 1 : 1001;

        const deliveryFee = 40.00;
        const subtotal = orderData.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        const tax = parseFloat((subtotal * 0.05).toFixed(2));
        const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

        const newOrder = {
            order_id: newId,
            customer_id: currentUser ? currentUser.customer_id : 1,
            customer_name: orderData.customer_name,
            delivery_phone: orderData.delivery_phone,
            delivery_address: orderData.delivery_address,
            delivery_city: orderData.delivery_city,
            delivery_state: orderData.delivery_state,
            delivery_pincode: orderData.delivery_pincode,
            special_instructions: orderData.special_instructions || '',
            payment_method: orderData.payment_method || 'Cash on Delivery',
            subtotal: subtotal,
            delivery_fee: deliveryFee,
            tax: tax,
            total_amount: total,
            status: 'Pending',
            created_at: new Date().toISOString(),
            items: orderData.items.map((i, idx) => ({
                order_item_id: idx + 1,
                order_id: newId,
                food_id: i.food_id,
                food_name: i.name,
                price: parseFloat(i.price),
                quantity: i.quantity,
                subtotal: parseFloat(i.price) * i.quantity,
                image_url: i.image_url
            }))
        };

        orders.unshift(newOrder);
        localStorage.setItem(StorageKeys.ORDERS, JSON.stringify(orders));

        return {
            success: true,
            message: '🎉 Order placed successfully! Your food is being prepared.',
            order: newOrder
        };
    },

    cancelOrder(orderId) {
        const id = parseInt(orderId, 10);
        let orders = this.getOrders();
        const order = orders.find(o => o.order_id === id);

        if (!order) {
            return { success: false, message: 'Order not found.' };
        }

        if (order.status !== 'Pending') {
            return { success: false, message: `Cannot cancel order with status "${order.status}". Only Pending orders can be cancelled.` };
        }

        order.status = 'Cancelled';
        localStorage.setItem(StorageKeys.ORDERS, JSON.stringify(orders));
        return { success: true, message: `Order #${id} cancelled successfully.`, order };
    },

    updateOrderStatus(orderId, newStatus) {
        const id = parseInt(orderId, 10);
        let orders = this.getOrders();
        const order = orders.find(o => o.order_id === id);
        if (order) {
            order.status = newStatus;
            localStorage.setItem(StorageKeys.ORDERS, JSON.stringify(orders));
            return { success: true, message: `Order #${id} status changed to ${newStatus}.` };
        }
        return { success: false, message: 'Order not found.' };
    },

    // ----------------------------------------------------
    // ADMIN AUTH & DASHBOARD STATS
    // ----------------------------------------------------
    isAdminLoggedIn() {
        return Boolean(localStorage.getItem(StorageKeys.ADMIN_SESSION));
    },

    adminLogin(username, password) {
        if ((username === 'admin' || username === 'admin@foodiehub.com') && password === 'admin123') {
            localStorage.setItem(StorageKeys.ADMIN_SESSION, JSON.stringify({ username: 'admin', role: 'superadmin' }));
            return { success: true, message: 'Welcome Admin, admin!' };
        }
        return { success: false, message: 'Invalid admin credentials. Use admin / admin123' };
    },

    adminLogout() {
        localStorage.removeItem(StorageKeys.ADMIN_SESSION);
        return { success: true, message: 'Admin logged out successfully.' };
    },

    getAdminStats() {
        const orders = this.getOrders();
        const foods = this.getFoods();
        const customers = this.getCustomers();
        const restaurants = this.getRestaurants();

        const activeOrders = orders.filter(o => o.status !== 'Cancelled');
        const totalRevenue = activeOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

        return {
            total_orders: orders.length,
            total_revenue: totalRevenue,
            total_foods: foods.length,
            total_customers: customers.length,
            total_restaurants: restaurants.length
        };
    },

    getAdminCustomers() {
        const customers = this.getCustomers();
        const orders = this.getOrders();

        return customers.map(c => {
            const customerOrders = orders.filter(o => o.customer_id === c.customer_id);
            const totalSpent = customerOrders
                .filter(o => o.status !== 'Cancelled')
                .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

            return {
                ...c,
                total_orders: customerOrders.length,
                total_spent: totalSpent
            };
        });
    }
};

// Global Toast Notification Helper
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '99999';
        document.body.appendChild(container);
    }

    const toastId = 'toast_' + Date.now();
    const bgClass = type === 'success' ? 'bg-success text-white' : type === 'danger' || type === 'error' ? 'bg-danger text-white' : type === 'warning' ? 'bg-warning text-dark' : 'bg-primary text-white';
    const iconClass = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' || type === 'error' ? 'bi-exclamation-octagon-fill' : 'bi-info-circle-fill';

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${iconClass} fs-5"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    if (toastEl && typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
        bsToast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }
}

// Format Currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount || 0).toFixed(2);
}

// Initialize immediately
StorageService.init();

// Export to window
if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
    window.showToast = showToast;
    window.formatCurrency = formatCurrency;
}
