/* ========================================================
   FOODIEHUB - CART MANAGEMENT
======================================================== */

const CART_STORAGE_KEY = 'foodiehub_cart';
const DELIVERY_FEE = 40.00;
const TAX_RATE = 0.05; // 5% GST

const Cart = {
    // Get all items in cart
    getItems() {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Error reading cart from localStorage', e);
            return [];
        }
    },

    // Save cart
    saveItems(items) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items } }));
        this.updateCartBadge();
    },

    // Add item to cart
    addItem(food, quantity = 1) {
        const items = this.getItems();
        const existingIndex = items.findIndex(item => item.food_id === food.food_id);

        if (existingIndex > -1) {
            items[existingIndex].quantity += quantity;
        } else {
            items.push({
                food_id: food.food_id,
                name: food.name,
                price: parseFloat(food.price),
                category: food.category,
                restaurant_name: food.restaurant_name || '',
                image_url: food.image_url,
                quantity: quantity
            });
        }

        this.saveItems(items);
        showToast(`Added <strong>${food.name}</strong> to your cart!`, 'success');
        this.renderCartOffcanvas();
    },

    // Remove item
    removeItem(foodId) {
        let items = this.getItems();
        const removed = items.find(i => i.food_id === foodId);
        items = items.filter(item => item.food_id !== foodId);
        this.saveItems(items);
        if (removed) {
            showToast(`Removed <strong>${removed.name}</strong> from cart.`, 'warning');
        }
        this.renderCartOffcanvas();
    },

    // Update quantity
    updateQuantity(foodId, change) {
        const items = this.getItems();
        const item = items.find(i => i.food_id === foodId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                return this.removeItem(foodId);
            }
            this.saveItems(items);
            this.renderCartOffcanvas();
        }
    },

    // Clear entire cart
    clear() {
        localStorage.removeItem(CART_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: [] } }));
        this.updateCartBadge();
        this.renderCartOffcanvas();
    },

    // Calculation summary
    getSummary() {
        const items = this.getItems();
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
        const tax = subtotal > 0 ? parseFloat((subtotal * TAX_RATE).toFixed(2)) : 0;
        const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

        return {
            itemCount,
            subtotal,
            deliveryFee,
            tax,
            total
        };
    },

    // Update badge in navbar
    updateCartBadge() {
        const badgeEls = document.querySelectorAll('.cart-count-badge');
        const summary = this.getSummary();
        badgeEls.forEach(badge => {
            badge.textContent = summary.itemCount;
            badge.style.display = summary.itemCount > 0 ? 'inline-flex' : 'none';
        });
    },

    // Render Cart drawer
    renderCartOffcanvas() {
        const container = document.getElementById('cartItemsList');
        const summaryEl = document.getElementById('cartSummaryBox');
        const emptyStateEl = document.getElementById('cartEmptyState');
        const checkoutBtn = document.getElementById('cartProceedCheckoutBtn');

        if (!container) return;

        const items = this.getItems();
        const summary = this.getSummary();

        if (items.length === 0) {
            container.innerHTML = '';
            if (summaryEl) summaryEl.style.display = 'none';
            if (emptyStateEl) emptyStateEl.style.display = 'block';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        if (emptyStateEl) emptyStateEl.style.display = 'none';
        if (summaryEl) summaryEl.style.display = 'block';
        if (checkoutBtn) checkoutBtn.disabled = false;

        container.innerHTML = items.map(item => `
            <div class="cart-item-row">
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-thumb">
                <div class="flex-grow-1">
                    <div class="fw-bold text-dark fs-6">${item.name}</div>
                    <div class="text-muted small">${item.restaurant_name ? item.restaurant_name + ' • ' : ''}${formatCurrency(item.price)}</div>
                    <div class="d-flex align-items-center gap-2 mt-2">
                        <button class="btn btn-sm btn-outline-secondary cart-qty-btn" onclick="Cart.updateQuantity(${item.food_id}, -1)">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="fw-bold px-2">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary cart-qty-btn" onclick="Cart.updateQuantity(${item.food_id}, 1)">
                            <i class="bi bi-plus"></i>
                        </button>
                        <span class="ms-auto fw-bold text-dark">${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                </div>
                <button class="btn btn-link text-danger p-1" title="Remove Item" onclick="Cart.removeItem(${item.food_id})">
                    <i class="bi bi-trash fs-5"></i>
                </button>
            </div>
        `).join('');

        // Summary details
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Subtotal (${summary.itemCount} items)</span>
                    <span class="fw-semibold">${formatCurrency(summary.subtotal)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Delivery Fee</span>
                    <span class="fw-semibold">${formatCurrency(summary.deliveryFee)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Govt. Taxes & GST (5%)</span>
                    <span class="fw-semibold">${formatCurrency(summary.tax)}</span>
                </div>
                <hr class="my-2">
                <div class="d-flex justify-content-between fs-5 fw-bold text-dark">
                    <span>Total Amount</span>
                    <span class="text-warning text-dark">${formatCurrency(summary.total)}</span>
                </div>
            `;
        }
    }
};

// Initialize badge and event listener on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateCartBadge();
    Cart.renderCartOffcanvas();

    // Listen for storage events across tabs
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) {
            Cart.updateCartBadge();
            Cart.renderCartOffcanvas();
        }
    });
});
