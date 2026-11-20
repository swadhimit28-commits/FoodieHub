/* ========================================================
   FOODIEHUB - ADMIN DASHBOARD SCRIPT
======================================================== */

let adminStats = null;
let adminOrders = [];
let adminFoods = [];
let adminRestaurants = [];
let adminCustomers = [];

document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAuth();
});

// Check Admin Session
async function checkAdminAuth() {
    const admin = await API.getCurrentAdmin();
    const loginSection = document.getElementById('adminLoginSection');
    const dashboardSection = document.getElementById('adminDashboardSection');
    const adminUserLabel = document.getElementById('adminUsernameLabel');

    if (!admin) {
        if (loginSection) loginSection.style.display = 'block';
        if (dashboardSection) dashboardSection.style.display = 'none';
        return;
    }

    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    if (adminUserLabel) adminUserLabel.textContent = admin.username;

    // Load initial data
    await loadAdminDashboard();
}

// Admin Login Form
async function handleAdminLogin(e) {
    e.preventDefault();
    const userEl = document.getElementById('adminUsernameInput');
    const passEl = document.getElementById('adminPasswordInput');
    const btn = document.getElementById('adminLoginBtn');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Authenticating...';

    const res = await API.post('/api/admin/login', {
        username: userEl.value.trim(),
        password: passEl.value
    });

    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Sign In to Admin Panel';

    if (res.ok && res.data.success) {
        showToast(res.data.message, 'success');
        await checkAdminAuth();
    } else {
        showToast(res.data.message || 'Invalid credentials.', 'error');
    }
}

// Admin Logout
async function handleAdminLogout() {
    await API.logoutAdmin();
    showToast('Admin logged out successfully.', 'info');
    await checkAdminAuth();
}

// Load Dashboard Data
async function loadAdminDashboard() {
    await Promise.all([
        loadStats(),
        loadOrders(),
        loadFoodsList(),
        loadRestaurantsList(),
        loadCustomersList()
    ]);
}

// 1. STATS
async function loadStats() {
    const res = await API.get('/api/admin/dashboard-stats');
    if (res.ok && res.data.success) {
        const s = res.data.stats;
        adminStats = s;

        document.getElementById('statTotalOrders').textContent = s.total_orders;
        document.getElementById('statTotalRevenue').textContent = formatCurrency(s.total_revenue);
        document.getElementById('statTotalFoods').textContent = s.total_foods;
        document.getElementById('statTotalCustomers').textContent = s.total_customers;
        document.getElementById('statTotalRestaurants').textContent = s.total_restaurants;
    }
}

// 2. ORDERS MANAGEMENT
async function loadOrders() {
    const res = await API.get('/api/admin/orders');
    if (res.ok && res.data.success) {
        adminOrders = res.data.orders;
        renderAdminOrders(adminOrders);
    }
}

function renderAdminOrders(orders) {
    const tbody = document.getElementById('adminOrdersTableBody');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No orders found in database.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusSelect = `
            <select class="form-select form-select-sm fw-semibold" onchange="updateOrderStatus(${order.order_id}, this.value)" style="width: 140px;">
                <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
        `;

        return `
            <tr>
                <td class="fw-bold">#${order.order_id}</td>
                <td>
                    <div class="fw-semibold text-dark">${order.customer_name}</div>
                    <div class="small text-muted">${order.delivery_phone}</div>
                </td>
                <td class="small">
                    <div class="text-truncate" style="max-width: 200px;" title="${order.delivery_address}, ${order.delivery_city}">${order.delivery_address}, ${order.delivery_city}</div>
                    <div class="text-muted">${order.payment_method}</div>
                </td>
                <td>
                    <div class="small">
                        ${order.items.map(i => `<div>${i.quantity}x ${i.food_name}</div>`).join('')}
                    </div>
                </td>
                <td class="fw-bold text-dark">${formatCurrency(order.total_amount)}</td>
                <td>${statusSelect}</td>
                <td class="small text-muted">${dateStr}</td>
            </tr>
        `;
    }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    const res = await API.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus });
    if (res.ok && res.data.success) {
        showToast(res.data.message, 'success');
        await loadStats();
    } else {
        showToast(res.data.message || 'Failed to update order status.', 'error');
        await loadOrders();
    }
}

// 3. FOODS MANAGEMENT
async function loadFoodsList() {
    const res = await API.get('/api/foods');
    if (res.ok && res.data.success) {
        adminFoods = res.data.data;
        renderAdminFoods(adminFoods);
    }
}

function renderAdminFoods(foods) {
    const tbody = document.getElementById('adminFoodsTableBody');
    if (!tbody) return;

    if (foods.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No food items found.</td></tr>';
        return;
    }

    tbody.innerHTML = foods.map(food => {
        const isAvail = Boolean(food.is_available);
        return `
            <tr>
                <td>
                    <img src="${food.image_url}" class="rounded-3 shadow-sm" width="48" height="48" style="object-fit:cover;">
                </td>
                <td>
                    <div class="fw-bold text-dark">${food.name}</div>
                    <div class="small text-muted text-truncate" style="max-width: 250px;">${food.description}</div>
                </td>
                <td><span class="badge bg-dark">${food.category}</span></td>
                <td class="small text-muted">${food.restaurant_name}</td>
                <td class="fw-bold text-dark">${formatCurrency(food.price)}</td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" ${isAvail ? 'checked' : ''}
                               onchange="toggleFoodAvailability(${food.food_id}, this.checked)">
                        <label class="form-check-label small">${isAvail ? 'Available' : 'Unavailable'}</label>
                    </div>
                </td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="openEditFoodModal(${food.food_id})" title="Edit Food">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteFoodItem(${food.food_id}, '${food.name.replace(/'/g, "\\'")}')" title="Delete Food">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function toggleFoodAvailability(foodId, isAvailable) {
    const res = await API.patch(`/api/foods/${foodId}/availability`, { is_available: isAvailable });
    if (res.ok && res.data.success) {
        showToast('Availability status updated.', 'success');
    } else {
        showToast('Could not update status.', 'error');
        await loadFoodsList();
    }
}

async function deleteFoodItem(foodId, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    const res = await API.delete(`/api/foods/${foodId}`);
    if (res.ok && res.data.success) {
        showToast(res.data.message, 'success');
        await loadFoodsList();
        await loadStats();
    } else {
        showToast(res.data.message || 'Failed to delete food.', 'error');
    }
}

// Open Food Modal (Add or Edit)
function openAddFoodModal() {
    document.getElementById('foodModalLabel').textContent = 'Add New Food Item';
    document.getElementById('foodModalId').value = '';
    document.getElementById('foodModalForm').reset();
    populateRestaurantSelectInModal();

    const modal = new bootstrap.Modal(document.getElementById('foodModal'));
    modal.show();
}

function openEditFoodModal(foodId) {
    const food = adminFoods.find(f => f.food_id === foodId);
    if (!food) return;

    document.getElementById('foodModalLabel').textContent = 'Edit Food Item';
    document.getElementById('foodModalId').value = food.food_id;
    populateRestaurantSelectInModal(food.restaurant_id);

    document.getElementById('foodModalName').value = food.name;
    document.getElementById('foodModalCategory').value = food.category;
    document.getElementById('foodModalPrice').value = food.price;
    document.getElementById('foodModalImage').value = food.image_url;
    document.getElementById('foodModalDesc').value = food.description;
    document.getElementById('foodModalAvailable').checked = Boolean(food.is_available);

    const modal = new bootstrap.Modal(document.getElementById('foodModal'));
    modal.show();
}

function populateRestaurantSelectInModal(selectedId = null) {
    const select = document.getElementById('foodModalRestaurant');
    if (select && adminRestaurants.length > 0) {
        select.innerHTML = adminRestaurants.map(r => `
            <option value="${r.restaurant_id}" ${selectedId === r.restaurant_id ? 'selected' : ''}>${r.name} (${r.cuisine})</option>
        `).join('');
    }
}

async function handleSaveFood(e) {
    e.preventDefault();
    const id = document.getElementById('foodModalId').value;
    const isEdit = Boolean(id);

    const payload = {
        restaurant_id: document.getElementById('foodModalRestaurant').value,
        name: document.getElementById('foodModalName').value.trim(),
        category: document.getElementById('foodModalCategory').value,
        price: parseFloat(document.getElementById('foodModalPrice').value),
        image_url: document.getElementById('foodModalImage').value.trim(),
        description: document.getElementById('foodModalDesc').value.trim(),
        is_available: document.getElementById('foodModalAvailable').checked
    };

    let res;
    if (isEdit) {
        res = await API.put(`/api/foods/${id}`, payload);
    } else {
        res = await API.post('/api/foods', payload);
    }

    if (res.ok && res.data.success) {
        showToast(res.data.message, 'success');
        const modalEl = document.getElementById('foodModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();

        await loadFoodsList();
        await loadStats();
    } else {
        showToast(res.data.message || 'Error saving food item.', 'error');
    }
}

// 4. RESTAURANTS MANAGEMENT
async function loadRestaurantsList() {
    const res = await API.get('/api/restaurants');
    if (res.ok && res.data.success) {
        adminRestaurants = res.data.data;
        renderAdminRestaurants(adminRestaurants);
        populateRestaurantSelectInModal();
    }
}

function renderAdminRestaurants(restaurants) {
    const tbody = document.getElementById('adminRestaurantsTableBody');
    if (!tbody) return;

    if (restaurants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No restaurants found.</td></tr>';
        return;
    }

    tbody.innerHTML = restaurants.map(r => `
        <tr>
            <td>
                <img src="${r.image_url}" class="rounded-3 shadow-sm" width="48" height="48" style="object-fit:cover;">
            </td>
            <td>
                <div class="fw-bold text-dark">${r.name}</div>
                <div class="small text-muted">${r.address}</div>
            </td>
            <td><span class="badge bg-secondary">${r.cuisine}</span></td>
            <td><span class="badge bg-warning text-dark"><i class="bi bi-star-fill me-1"></i> ${r.rating}</span></td>
            <td class="fw-semibold">${r.total_items || 0} dishes</td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="openEditRestaurantModal(${r.restaurant_id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteRestaurant(${r.restaurant_id}, '${r.name.replace(/'/g, "\\'")}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddRestaurantModal() {
    document.getElementById('restaurantModalLabel').textContent = 'Add New Restaurant';
    document.getElementById('restaurantModalId').value = '';
    document.getElementById('restaurantModalForm').reset();

    const modal = new bootstrap.Modal(document.getElementById('restaurantModal'));
    modal.show();
}

function openEditRestaurantModal(restId) {
    const r = adminRestaurants.find(x => x.restaurant_id === restId);
    if (!r) return;

    document.getElementById('restaurantModalLabel').textContent = 'Edit Restaurant';
    document.getElementById('restaurantModalId').value = r.restaurant_id;
    document.getElementById('restaurantModalName').value = r.name;
    document.getElementById('restaurantModalCuisine').value = r.cuisine;
    document.getElementById('restaurantModalRating').value = r.rating;
    document.getElementById('restaurantModalImage').value = r.image_url;
    document.getElementById('restaurantModalAddress').value = r.address;

    const modal = new bootstrap.Modal(document.getElementById('restaurantModal'));
    modal.show();
}

async function handleSaveRestaurant(e) {
    e.preventDefault();
    const id = document.getElementById('restaurantModalId').value;
    const isEdit = Boolean(id);

    const payload = {
        name: document.getElementById('restaurantModalName').value.trim(),
        cuisine: document.getElementById('restaurantModalCuisine').value.trim(),
        rating: parseFloat(document.getElementById('restaurantModalRating').value) || 4.5,
        image_url: document.getElementById('restaurantModalImage').value.trim(),
        address: document.getElementById('restaurantModalAddress').value.trim()
    };

    let res;
    if (isEdit) {
        res = await API.put(`/api/restaurants/${id}`, payload);
    } else {
        res = await API.post('/api/restaurants', payload);
    }

    if (res.ok && res.data.success) {
        showToast(res.data.message, 'success');
        const modalEl = document.getElementById('restaurantModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();

        await loadRestaurantsList();
        await loadStats();
    } else {
        showToast(res.data.message || 'Error saving restaurant.', 'error');
    }
}

async function deleteRestaurant(restId, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? All associated food items will also be removed!`)) return;

    const res = await API.delete(`/api/restaurants/${restId}`);
    if (res.ok && res.data.success) {
        showToast(res.data.message, 'success');
        await loadRestaurantsList();
        await loadFoodsList();
        await loadStats();
    } else {
        showToast(res.data.message || 'Failed to delete restaurant.', 'error');
    }
}

// 5. CUSTOMERS MANAGEMENT
async function loadCustomersList() {
    const res = await API.get('/api/admin/customers');
    if (res.ok && res.data.success) {
        adminCustomers = res.data.customers;
        renderAdminCustomers(adminCustomers);
    }
}

function renderAdminCustomers(customers) {
    const tbody = document.getElementById('adminCustomersTableBody');
    if (!tbody) return;

    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No registered customers yet.</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td class="fw-bold">#${c.customer_id}</td>
            <td>
                <div class="fw-bold text-dark">${c.name}</div>
                <div class="small text-muted">${c.email}</div>
            </td>
            <td>${c.phone}</td>
            <td class="small">
                <div>${c.address}</div>
                <div class="text-muted">${c.city}, ${c.state} - ${c.pincode}</div>
            </td>
            <td><span class="badge bg-primary">${c.total_orders} orders</span></td>
            <td class="fw-bold text-success">${formatCurrency(c.total_spent)}</td>
            <td class="small text-muted">${new Date(c.created_at).toLocaleDateString('en-IN')}</td>
        </tr>
    `).join('');
}
