/* ========================================================
   FOODIEHUB - API UTILITY & CLIENT HELPERS
======================================================== */

const API = {
    // Generic fetch wrapper with credentials
    async request(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            credentials: 'include', // Important for session cookies
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const res = await fetch(url, config);
            const data = await res.json();
            return { ok: res.ok, status: res.status, data };
        } catch (err) {
            console.error(`API Error on ${url}:`, err);
            return { ok: false, status: 500, data: { success: false, message: 'Network or server error.' } };
        }
    },

    get(url) {
        return this.request(url, { method: 'GET' });
    },

    post(url, body) {
        return this.request(url, { method: 'POST', body });
    },

    put(url, body) {
        return this.request(url, { method: 'PUT', body });
    },

    patch(url, body) {
        return this.request(url, { method: 'PATCH', body });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    },

    // Session helpers
    async getCurrentCustomer() {
        const res = await this.get('/api/auth/current');
        return res.ok && res.data.success ? res.data.customer : null;
    },

    async logoutCustomer() {
        return await this.post('/api/auth/logout');
    },

    async getCurrentAdmin() {
        const res = await this.get('/api/admin/check');
        return res.ok && res.data.success ? res.data.admin : null;
    },

    async logoutAdmin() {
        return await this.post('/api/admin/logout');
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
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
    bsToast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Format Currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount || 0).toFixed(2);
}
