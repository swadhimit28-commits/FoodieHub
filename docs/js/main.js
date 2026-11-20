/* ========================================================
   FOODIEHUB - MAIN HOMEPAGE SCRIPT (FOR GITHUB PAGES)
======================================================== */

let allFoods = [];
let selectedCategory = 'all';
let selectedRestaurant = 'all';
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Storage
    StorageService.init();

    // 2. Check current customer session
    checkCustomerAuth();

    // 3. Load restaurant filter dropdown
    loadRestaurantsDropdown();

    // 4. Load foods from Storage
    loadFoods();

    // 5. Setup event listeners
    setupEventListeners();
});

// Check if customer is logged in
function checkCustomerAuth() {
    const customer = StorageService.getCurrentCustomer();
    const navAuthContainer = document.getElementById('navAuthContainer');
    const navMyOrdersLink = document.getElementById('navMyOrdersLink');

    if (customer) {
        if (navMyOrdersLink) navMyOrdersLink.style.display = 'block';
        if (navAuthContainer) {
            navAuthContainer.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-light dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle fs-5 text-warning"></i>
                        <span>${customer.name.split(' ')[0]}</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow">
                        <li><h6 class="dropdown-header text-truncate" style="max-width: 200px;">${customer.email}</h6></li>
                        <li><a class="dropdown-item" href="my-orders.html"><i class="bi bi-receipt me-2"></i> My Orders</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item text-danger" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i> Logout</button></li>
                    </ul>
                </div>
            `;
        }
    } else {
        if (navMyOrdersLink) navMyOrdersLink.style.display = 'none';
        if (navAuthContainer) {
            navAuthContainer.innerHTML = `
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-light btn-sm" data-bs-toggle="modal" data-bs-target="#loginModal">
                        <i class="bi bi-box-arrow-in-right me-1"></i> Login
                    </button>
                    <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#registerModal">
                        Register
                    </button>
                </div>
            `;
        }
    }
}

// Handle Logout
function handleLogout() {
    StorageService.logoutCustomer();
    showToast('Logged out successfully.', 'info');
    setTimeout(() => {
        checkCustomerAuth();
    }, 500);
}

// Load Restaurant dropdown options
function loadRestaurantsDropdown() {
    const restaurants = StorageService.getRestaurants();
    const selectEl = document.getElementById('restaurantFilterSelect');
    if (selectEl) {
        selectEl.innerHTML = '<option value="all">All Kitchens & Restaurants</option>' +
            restaurants.map(r => `<option value="${r.restaurant_id}">${r.name} (${r.cuisine})</option>`).join('');
    }
}

// Load Foods from StorageService
function loadFoods() {
    const container = document.getElementById('foodsGridContainer');
    const spinner = document.getElementById('foodsLoadingSpinner');

    if (spinner) spinner.style.display = 'block';

    setTimeout(() => {
        if (spinner) spinner.style.display = 'none';

        allFoods = StorageService.getFoods({
            category: selectedCategory,
            restaurant_id: selectedRestaurant,
            search: currentSearchTerm
        });

        renderFoodsGrid(allFoods);
    }, 150);
}

// Render Food Cards Grid
function renderFoodsGrid(foods) {
    const container = document.getElementById('foodsGridContainer');
    const emptyState = document.getElementById('foodsEmptyState');

    if (!container) return;

    if (!foods || foods.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = foods.map(food => {
        const isAvailable = Boolean(food.is_available);
        const availBadge = isAvailable
            ? '<span class="badge bg-success badge-availability"><i class="bi bi-check-circle me-1"></i> Available</span>'
            : '<span class="badge bg-danger badge-availability"><i class="bi bi-x-circle me-1"></i> Sold Out</span>';

        return `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="food-card">
                    <div class="food-img-wrapper">
                        <img src="${food.image_url}" alt="${food.name}" loading="lazy">
                        <span class="badge-category">${food.category}</span>
                        ${availBadge}
                    </div>
                    <div class="food-card-body">
                        <div class="restaurant-label">
                            <i class="bi bi-shop text-warning"></i>
                            <span class="text-truncate">${food.restaurant_name}</span>
                            <span class="badge bg-light text-dark ms-auto border"><i class="bi bi-star-fill text-warning"></i> ${food.restaurant_rating || '4.5'}</span>
                        </div>
                        <h5 class="food-title" title="${food.name}">${food.name}</h5>
                        <p class="food-desc">${food.description}</p>
                        <div class="food-card-footer">
                            <div class="food-price">${formatCurrency(food.price)}</div>
                            <div class="food-actions">
                                <button class="btn btn-outline-dark btn-sm" onclick="openFoodDetailsModal(${food.food_id})" title="View Details">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-warning btn-sm d-flex align-items-center gap-1"
                                        ${!isAvailable ? 'disabled title="Currently Unavailable"' : ''}
                                        onclick="handleAddToCart(${food.food_id})">
                                    <i class="bi bi-cart-plus-fill"></i> Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Add to Cart handler
function handleAddToCart(foodId) {
    const food = allFoods.find(f => f.food_id === foodId);
    if (food) {
        Cart.addItem(food, 1);
    }
}

// Open Food Details Modal
function openFoodDetailsModal(foodId) {
    const food = StorageService.getFoodById(foodId) || allFoods.find(f => f.food_id === foodId);

    if (!food) {
        showToast('Food item not found.', 'error');
        return;
    }

    const modalBody = document.getElementById('foodDetailsModalBody');
    const modalTitle = document.getElementById('foodDetailsModalLabel');
    const modalAddBtn = document.getElementById('foodDetailsAddToCartBtn');

    if (modalTitle) modalTitle.textContent = food.name;

    const isAvailable = Boolean(food.is_available);

    if (modalBody) {
        modalBody.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <img src="${food.image_url}" class="img-fluid rounded-3 shadow-sm w-100" style="height: 280px; object-fit: cover;" alt="${food.name}">
                </div>
                <div class="col-md-6 d-flex flex-direction-column justify-content-between">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-dark">${food.category}</span>
                            ${isAvailable ? '<span class="badge bg-success">In Stock</span>' : '<span class="badge bg-danger">Currently Unavailable</span>'}
                        </div>
                        <h4 class="fw-bold mb-2">${food.name}</h4>
                        <div class="text-muted small mb-3">
                            <i class="bi bi-shop me-1 text-warning"></i> Prepared by <strong>${food.restaurant_name}</strong>
                            <br><i class="bi bi-geo-alt me-1 text-danger"></i> ${food.restaurant_address || 'Partner Kitchen'}
                        </div>
                        <p class="text-secondary">${food.description}</p>
                    </div>
                    <div class="pt-3 border-top mt-3 d-flex align-items-center justify-content-between">
                        <div>
                            <span class="text-muted small d-block">Price per portion</span>
                            <span class="fs-3 fw-bold text-dark">${formatCurrency(food.price)}</span>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <label class="small text-muted">Qty:</label>
                            <input type="number" id="modalFoodQuantity" class="form-control form-control-sm text-center" value="1" min="1" max="20" style="width: 70px;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (modalAddBtn) {
        modalAddBtn.disabled = !isAvailable;
        modalAddBtn.onclick = () => {
            const qtyInput = document.getElementById('modalFoodQuantity');
            const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
            Cart.addItem(food, qty);
            const modalEl = document.getElementById('foodDetailsModal');
            const bsModal = bootstrap.Modal.getInstance(modalEl);
            if (bsModal) bsModal.hide();
        };
    }

    const foodDetailsModal = new bootstrap.Modal(document.getElementById('foodDetailsModal'));
    foodDetailsModal.show();
}

// Category filter selection (from buttons or category collage)
function filterByCategory(category) {
    selectedCategory = category;

    // Update active state on filter buttons
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    loadFoods();
}

// Event Listeners Setup
function setupEventListeners() {
    // 1. Search input debounce
    const searchInput = document.getElementById('foodSearchInput');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchTerm = e.target.value.trim();
                loadFoods();
            }, 250);
        });
    }

    // 2. Category buttons
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-category');
            filterByCategory(cat);
        });
    });

    // 3. Restaurant filter dropdown
    const restSelect = document.getElementById('restaurantFilterSelect');
    if (restSelect) {
        restSelect.addEventListener('change', (e) => {
            selectedRestaurant = e.target.value;
            loadFoods();
        });
    }

    // 4. Registration Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating Account...';

            setTimeout(() => {
                const payload = {
                    name: document.getElementById('regName').value.trim(),
                    email: document.getElementById('regEmail').value.trim(),
                    phone: document.getElementById('regPhone').value.trim(),
                    address: document.getElementById('regAddress').value.trim(),
                    city: document.getElementById('regCity').value.trim(),
                    state: document.getElementById('regState').value.trim(),
                    pincode: document.getElementById('regPincode').value.trim(),
                    password: document.getElementById('regPassword').value
                };

                const res = StorageService.registerCustomer(payload);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Customer Account';

                if (res.success) {
                    showToast(res.message, 'success');
                    registerForm.reset();
                    const modalEl = document.getElementById('registerModal');
                    const bsModal = bootstrap.Modal.getInstance(modalEl);
                    if (bsModal) bsModal.hide();
                    checkCustomerAuth();
                } else {
                    showToast(res.message, 'error');
                }
            }, 300);
        });
    }

    // 5. Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Logging In...';

            setTimeout(() => {
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;

                const res = StorageService.loginCustomer(email, password);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login to Account';

                if (res.success) {
                    showToast(res.message, 'success');
                    loginForm.reset();
                    const modalEl = document.getElementById('loginModal');
                    const bsModal = bootstrap.Modal.getInstance(modalEl);
                    if (bsModal) bsModal.hide();
                    checkCustomerAuth();
                } else {
                    showToast(res.message, 'error');
                }
            }, 300);
        });
    }

    // 6. Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

            setTimeout(() => {
                const name = document.getElementById('contactName').value.trim();
                showToast(`Thank you, <strong>${name}</strong>! Your message has been received. Our team will contact you soon.`, 'success');
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-send-fill me-1"></i> Send Message';
            }, 400);
        });
    }
}
