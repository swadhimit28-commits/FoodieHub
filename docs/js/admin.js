/* ========================================================
   FOODIEHUB - ADMIN DASHBOARD SCRIPT (FOR GITHUB PAGES)
======================================================== */

let adminOrders = [];
let adminFoods = [];
let adminRestaurants = [];
let adminCustomers = [];

document.addEventListener('DOMContentLoaded', () => {
    StorageService.init();
    checkAdminAuth();
});

// Check Admin Session
function checkAdminAuth() {
    const isLoggedIn = StorageService.isAdminLoggedIn();
    const loginSection = document.getElementById('adminLoginSection');
    const dashboardSection = document.getElementById('adminDashboardSection');
    const adminUserLabel = document.getElementById('adminUsernameLabel');

    if (!isLoggedIn) {
        if (loginSection) loginSection.style.display = 'block';
        if (dashboardSection) dashboardSection.style.display = 'none';
        return;
    }

    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    if (adminUserLabel) adminUserLabel.textContent = 'admin';

    // Load initial data
    loadAdminDashboard();
}

// Admin Login Form
function handleAdminLogin(e) {
    e.preventDefault();
    const userEl = document.getElementById('adminUsernameInput');
    const passEl = document.getElementById('adminPasswordInput');
    const btn = document.getElementById('adminLoginBtn');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Authenticating...';

    setTimeout(() => {
        const res = StorageService.adminLogin(userEl.value.trim(), passEl.value);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Sign In to Admin Panel';

        if (res.success) {
            showToast(res.message, 'success');
            checkAdminAuth();
        } else {
            showToast(res.message, 'error');
        }
    }, 300);
}

// Admin Logout
function handleAdminLogout() {
    StorageService.adminLogout();
    showToast('Admin logged out successfully.', 'info');
    checkAdminAuth();
}

// Load Dashboard Data
function loadAdminDashboard() {
    loadStats();
    loadOrders();
    loadFoodsList();
    loadRestaurantsList();
    loadCustomersList();
}

// 1. STATS
function loadStats() {
    const s = StorageService.getAdminStats();
    document.getElementById('statTotalOrders').textContent = s.total_orders;
    document.getElementById('statTotalRevenue').textContent = formatCurrency(s.total_revenue);
    document.getElementById('statTotalFoods').textContent = s.total_foods;
    document.getElementById('statTotalCustomers').textContent = s.total_customers;
    document.getElementById('statTotalRestaurants').textContent = s.total_restaurants;
}

// 2. ORDERS MANAGEMENT
function loadOrders() {
    adminOrders = StorageService.getOrders();
    renderAdminOrders(adminOrders);
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

function updateOrderStatus(orderId, newStatus) {
    const res = StorageService.updateOrderStatus(orderId, newStatus);
    if (res.success) {
        showToast(res.message, 'success');
        loadStats();
    } else {
        showToast(res.message || 'Failed to update order status.', 'error');
        loadOrders();
    }
}

// 3. FOODS MANAGEMENT
function loadFoodsList() {
    adminFoods = StorageService.getFoods();
    renderAdminFoods(adminFoods);
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

function toggleFoodAvailability(foodId, isAvailable) {
    StorageService.toggleFoodAvailability(foodId, isAvailable);
    showToast('Availability status updated.', 'success');
}

function deleteFoodItem(foodId, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    StorageService.deleteFood(foodId);
    showToast(`"${name}" deleted successfully.`, 'success');
    loadFoodsList();
    loadStats();
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
    const restaurants = StorageService.getRestaurants();
    if (select && restaurants.length > 0) {
        select.innerHTML = restaurants.map(r => `
            <option value="${r.restaurant_id}" ${selectedId === r.restaurant_id ? 'selected' : ''}>${r.name} (${r.cuisine})</option>
        `).join('');
    }
}

function handleSaveFood(e) {
    e.preventDefault();
    const id = document.getElementById('foodModalId').value;

    const payload = {
        food_id: id ? parseInt(id, 10) : null,
        restaurant_id: document.getElementById('foodModalRestaurant').value,
        name: document.getElementById('foodModalName').value.trim(),
        category: document.getElementById('foodModalCategory').value,
        price: parseFloat(document.getElementById('foodModalPrice').value),
        image_url: document.getElementById('foodModalImage').value.trim(),
        description: document.getElementById('foodModalDesc').value.trim(),
        is_available: document.getElementById('foodModalAvailable').checked
    };

    StorageService.saveFood(payload);
    showToast(id ? 'Food item updated successfully.' : 'New food item added successfully.', 'success');

    const modalEl = document.getElementById('foodModal');
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();

    loadFoodsList();
    loadStats();
}

// 4. RESTAURANTS MANAGEMENT
function loadRestaurantsList() {
    adminRestaurants = StorageService.getRestaurants();
    renderAdminRestaurants(adminRestaurants);
    populateRestaurantSelectInModal();
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

function handleSaveRestaurant(e) {
    e.preventDefault();
    const id = document.getElementById('restaurantModalId').value;

    const payload = {
        restaurant_id: id ? parseInt(id, 10) : null,
        name: document.getElementById('restaurantModalName').value.trim(),
        cuisine: document.getElementById('restaurantModalCuisine').value.trim(),
        rating: parseFloat(document.getElementById('restaurantModalRating').value) || 4.5,
        image_url: document.getElementById('restaurantModalImage').value.trim(),
        address: document.getElementById('restaurantModalAddress').value.trim()
    };

    StorageService.saveRestaurant(payload);
    showToast(id ? 'Restaurant updated successfully.' : 'New restaurant created successfully.', 'success');

    const modalEl = document.getElementById('restaurantModal');
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();

    loadRestaurantsList();
    loadStats();
}

function deleteRestaurant(restId, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? All associated food items will also be removed!`)) return;

    StorageService.deleteRestaurant(restId);
    showToast(`"${name}" deleted successfully.`, 'success');

    loadRestaurantsList();
    loadFoodsList();
    loadStats();
}

// 5. CUSTOMERS MANAGEMENT
function loadCustomersList() {
    adminCustomers = StorageService.getAdminCustomers();
    renderAdminCustomers(adminCustomers);
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
