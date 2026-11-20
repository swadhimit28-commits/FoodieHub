/* ========================================================
   FOODIEHUB - CUSTOMER MY ORDERS SCRIPT
======================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    await initOrdersPage();
});

async function initOrdersPage() {
    const customer = await API.getCurrentCustomer();
    const loginPrompt = document.getElementById('ordersLoginPrompt');
    const ordersContainer = document.getElementById('ordersMainContainer');
    const customerNameDisplay = document.getElementById('customerNameDisplay');

    if (!customer) {
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (ordersContainer) ordersContainer.style.display = 'none';
        return;
    }

    if (loginPrompt) loginPrompt.style.display = 'none';
    if (ordersContainer) ordersContainer.style.display = 'block';
    if (customerNameDisplay) customerNameDisplay.textContent = customer.name;

    await loadCustomerOrders();
}

async function loadCustomerOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('ordersEmptyState');
    const spinner = document.getElementById('ordersLoadingSpinner');

    if (spinner) spinner.style.display = 'block';

    const res = await API.get('/api/orders/my-orders');

    if (spinner) spinner.style.display = 'none';

    if (res.ok && res.data.success) {
        const orders = res.data.orders;
        if (!orders || orders.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (tableBody) tableBody.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        renderOrdersTable(orders);
    } else {
        showToast(res.data.message || 'Could not load your orders.', 'error');
    }
}

function getStatusBadge(status) {
    switch (status) {
        case 'Pending':
            return '<span class="badge bg-warning text-dark"><i class="bi bi-clock-history me-1"></i> Pending</span>';
        case 'Preparing':
            return '<span class="badge bg-info text-dark"><i class="bi bi-fire me-1"></i> Preparing</span>';
        case 'Out for Delivery':
            return '<span class="badge bg-primary"><i class="bi bi-bicycle me-1"></i> Out for Delivery</span>';
        case 'Delivered':
            return '<span class="badge bg-success"><i class="bi bi-check2-circle me-1"></i> Delivered</span>';
        case 'Cancelled':
            return '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> Cancelled</span>';
        default:
            return `<span class="badge bg-secondary">${status}</span>`;
    }
}

function renderOrdersTable(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = orders.map(order => {
        const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const canCancel = order.status === 'Pending';

        return `
            <tr>
                <td class="fw-bold text-dark">#${order.order_id}</td>
                <td>
                    <div class="small fw-semibold text-dark">${dateStr}</div>
                    <div class="small text-muted">${order.payment_method}</div>
                </td>
                <td>
                    <div class="small fw-semibold text-dark">${order.customer_name}</div>
                    <div class="small text-muted text-truncate" style="max-width: 220px;" title="${order.delivery_address}, ${order.delivery_city}">
                        ${order.delivery_address}, ${order.delivery_city}
                    </div>
                </td>
                <td>
                    <div class="small">
                        ${order.items.map(item => `
                            <div>${item.quantity}x ${item.food_name}</div>
                        `).join('')}
                    </div>
                </td>
                <td class="fw-bold text-dark">${formatCurrency(order.total_amount)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-dark" onclick="viewOrderModal(${order.order_id})">
                            <i class="bi bi-eye"></i> Details
                        </button>
                        ${canCancel ? `
                            <button class="btn btn-outline-danger" onclick="cancelOrder(${order.order_id})">
                                <i class="bi bi-x-circle"></i> Cancel
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Cancel Order
async function cancelOrder(orderId) {
    if (!confirm(`Are you sure you want to cancel Order #${orderId}?`)) {
        return;
    }

    const res = await API.patch(`/api/orders/${orderId}/cancel`);
    if (res.ok && res.data.success) {
        showToast(res.data.message, 'success');
        await loadCustomerOrders();
    } else {
        showToast(res.data.message || 'Could not cancel order.', 'error');
    }
}

// View Order Details Modal
let cachedOrders = [];
async function viewOrderModal(orderId) {
    const res = await API.get(`/api/orders/${orderId}`);
    if (!res.ok || !res.data.success) {
        showToast('Could not load order details.', 'error');
        return;
    }

    const order = res.data.order;
    const modalBody = document.getElementById('orderDetailsModalBody');
    const modalIdTitle = document.getElementById('orderDetailsModalId');

    if (modalIdTitle) modalIdTitle.textContent = `#${order.order_id}`;

    if (modalBody) {
        modalBody.innerHTML = `
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <div class="p-3 bg-light rounded border">
                        <h6 class="fw-bold text-dark mb-2"><i class="bi bi-geo-alt-fill text-danger me-1"></i> Delivery Details</h6>
                        <p class="mb-1 fw-semibold">${order.customer_name}</p>
                        <p class="mb-1 text-muted small"><i class="bi bi-telephone me-1"></i> ${order.delivery_phone}</p>
                        <p class="mb-0 text-muted small">${order.delivery_address}, ${order.delivery_city}, ${order.delivery_state} - ${order.delivery_pincode}</p>
                        ${order.special_instructions ? `<p class="mt-2 mb-0 small text-primary fst-italic">Note: "${order.special_instructions}"</p>` : ''}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 bg-light rounded border">
                        <h6 class="fw-bold text-dark mb-2"><i class="bi bi-info-circle-fill text-primary me-1"></i> Order Summary</h6>
                        <div class="d-flex justify-content-between mb-1 small">
                            <span class="text-muted">Status:</span>
                            <span>${getStatusBadge(order.status)}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-1 small">
                            <span class="text-muted">Payment:</span>
                            <span class="fw-semibold">${order.payment_method}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-0 small">
                            <span class="text-muted">Date & Time:</span>
                            <span>${new Date(order.created_at).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <h6 class="fw-bold text-dark mb-2">Ordered Dishes</h6>
            <div class="table-responsive">
                <table class="table table-sm align-middle mb-3">
                    <thead class="table-light">
                        <tr>
                            <th>Food Item</th>
                            <th class="text-center">Qty</th>
                            <th class="text-end">Unit Price</th>
                            <th class="text-end">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center gap-2">
                                        ${item.image_url ? `<img src="${item.image_url}" class="rounded" width="36" height="36" style="object-fit:cover;">` : ''}
                                        <span class="fw-semibold">${item.food_name}</span>
                                    </div>
                                </td>
                                <td class="text-center fw-bold">${item.quantity}</td>
                                <td class="text-end">${formatCurrency(item.price)}</td>
                                <td class="text-end fw-bold">${formatCurrency(item.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end text-muted">Food Subtotal:</td>
                            <td class="text-end fw-bold">${formatCurrency(order.subtotal)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="text-end text-muted">Delivery Charges:</td>
                            <td class="text-end fw-bold">${formatCurrency(order.delivery_fee)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="text-end text-muted">Govt Taxes (5% GST):</td>
                            <td class="text-end fw-bold">${formatCurrency(order.tax)}</td>
                        </tr>
                        <tr class="table-warning">
                            <td colspan="3" class="text-end fw-bold fs-6">Grand Total:</td>
                            <td class="text-end fw-bold fs-6 text-dark">${formatCurrency(order.total_amount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}
