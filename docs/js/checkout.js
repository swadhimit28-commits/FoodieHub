/* ========================================================
   FOODIEHUB - MULTI-STEP CHECKOUT WIZARD (FOR GITHUB PAGES)
======================================================== */

let currentCheckoutStep = 1;

const Checkout = {
    // Open Checkout Modal
    init() {
        const items = Cart.getItems();
        if (items.length === 0) {
            showToast('Your cart is empty! Add foods before checkout.', 'warning');
            return;
        }

        // Check if customer is logged in
        const customer = StorageService.getCurrentCustomer();
        if (!customer) {
            showToast('Please log in or register to proceed to checkout.', 'info');
            // Close cart offcanvas if open
            const cartOffcanvasEl = document.getElementById('cartOffcanvas');
            if (cartOffcanvasEl) {
                const bsOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvasEl);
                if (bsOffcanvas) bsOffcanvas.hide();
            }
            // Open Login modal
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
            return;
        }

        // Prefill customer data if logged in
        this.prefillCustomerData(customer);

        // Reset to Step 1
        this.goToStep(1);

        // Close cart drawer if open
        const cartOffcanvasEl = document.getElementById('cartOffcanvas');
        if (cartOffcanvasEl) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvasEl);
            if (bsOffcanvas) bsOffcanvas.hide();
        }

        // Open checkout modal
        const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        checkoutModal.show();
    },

    prefillCustomerData(customer) {
        if (!customer) return;
        const nameEl = document.getElementById('checkoutName');
        const emailEl = document.getElementById('checkoutEmail');
        const phoneEl = document.getElementById('checkoutPhone');
        const addressEl = document.getElementById('checkoutAddress');
        const cityEl = document.getElementById('checkoutCity');
        const stateEl = document.getElementById('checkoutState');
        const pincodeEl = document.getElementById('checkoutPincode');

        if (nameEl && !nameEl.value) nameEl.value = customer.name || '';
        if (emailEl && !emailEl.value) emailEl.value = customer.email || '';
        if (phoneEl && !phoneEl.value) phoneEl.value = customer.phone || '';
        if (addressEl && !addressEl.value) addressEl.value = customer.address || '';
        if (cityEl && !cityEl.value) cityEl.value = customer.city || '';
        if (stateEl && !stateEl.value) stateEl.value = customer.state || '';
        if (pincodeEl && !pincodeEl.value) pincodeEl.value = customer.pincode || '';
    },

    goToStep(stepNumber) {
        currentCheckoutStep = stepNumber;

        // Update step panels visibility
        document.querySelectorAll('.checkout-step-panel').forEach(panel => {
            panel.classList.add('d-none');
        });
        const activePanel = document.getElementById(`checkoutStep${stepNumber}`);
        if (activePanel) activePanel.classList.remove('d-none');

        // Update indicators
        document.querySelectorAll('.step-indicator').forEach((ind, idx) => {
            const step = idx + 1;
            ind.classList.remove('active', 'completed');
            if (step === stepNumber) {
                ind.classList.add('active');
            } else if (step < stepNumber) {
                ind.classList.add('completed');
            }
        });

        // Update buttons
        const prevBtn = document.getElementById('checkoutPrevBtn');
        const nextBtn = document.getElementById('checkoutNextBtn');
        const placeBtn = document.getElementById('checkoutPlaceOrderBtn');

        if (prevBtn) prevBtn.style.display = stepNumber > 1 ? 'inline-block' : 'none';

        if (stepNumber === 4) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (placeBtn) placeBtn.style.display = 'inline-block';
            this.renderFinalReview();
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-block';
            if (placeBtn) placeBtn.style.display = 'none';
        }

        if (stepNumber === 3) {
            this.renderOrderSummary();
        }
    },

    nextStep() {
        if (!this.validateStep(currentCheckoutStep)) {
            return;
        }
        if (currentCheckoutStep < 4) {
            this.goToStep(currentCheckoutStep + 1);
        }
    },

    prevStep() {
        if (currentCheckoutStep > 1) {
            this.goToStep(currentCheckoutStep - 1);
        }
    },

    validateStep(step) {
        if (step === 1) {
            const name = document.getElementById('checkoutName').value.trim();
            const email = document.getElementById('checkoutEmail').value.trim();
            const phone = document.getElementById('checkoutPhone').value.trim();

            if (!name) {
                showToast('Please enter your full name.', 'error');
                return false;
            }
            if (!email || !email.includes('@')) {
                showToast('Please enter a valid email address.', 'error');
                return false;
            }
            if (!phone || phone.replace(/\D/g, '').length < 10) {
                showToast('Please enter a valid 10-digit phone number.', 'error');
                return false;
            }
            return true;
        }

        if (step === 2) {
            const address = document.getElementById('checkoutAddress').value.trim();
            const city = document.getElementById('checkoutCity').value.trim();
            const state = document.getElementById('checkoutState').value.trim();
            const pincode = document.getElementById('checkoutPincode').value.trim();

            if (!address || address.length < 5) {
                showToast('Please enter a complete delivery address.', 'error');
                return false;
            }
            if (!city) {
                showToast('Please enter your city.', 'error');
                return false;
            }
            if (!state) {
                showToast('Please enter your state.', 'error');
                return false;
            }
            if (!pincode || pincode.length < 5) {
                showToast('Please enter a valid postal pincode.', 'error');
                return false;
            }
            return true;
        }

        return true;
    },

    renderOrderSummary() {
        const container = document.getElementById('checkoutSummaryItems');
        const summary = Cart.getSummary();
        const items = Cart.getItems();

        if (container) {
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-sm align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Item</th>
                                <th class="text-center">Qty</th>
                                <th class="text-end">Price</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <img src="${item.image_url}" class="rounded" width="36" height="36" style="object-fit:cover;">
                                            <div>
                                                <div class="fw-bold">${item.name}</div>
                                                <small class="text-muted">${item.category}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center fw-bold">${item.quantity}</td>
                                    <td class="text-end">${formatCurrency(item.price)}</td>
                                    <td class="text-end fw-bold">${formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-end text-muted">Subtotal:</td>
                                <td class="text-end fw-bold">${formatCurrency(summary.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end text-muted">Standard Delivery:</td>
                                <td class="text-end fw-bold">${formatCurrency(summary.deliveryFee)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end text-muted">Govt. Taxes (5% GST):</td>
                                <td class="text-end fw-bold">${formatCurrency(summary.tax)}</td>
                            </tr>
                            <tr class="table-warning">
                                <td colspan="3" class="text-end fw-bold fs-6">Grand Total:</td>
                                <td class="text-end fw-bold fs-6">${formatCurrency(summary.total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }
    },

    renderFinalReview() {
        const reviewBox = document.getElementById('checkoutFinalReview');
        const summary = Cart.getSummary();

        const name = document.getElementById('checkoutName').value.trim();
        const phone = document.getElementById('checkoutPhone').value.trim();
        const address = document.getElementById('checkoutAddress').value.trim();
        const city = document.getElementById('checkoutCity').value.trim();
        const state = document.getElementById('checkoutState').value.trim();
        const pincode = document.getElementById('checkoutPincode').value.trim();
        const instructions = document.getElementById('checkoutInstructions').value.trim();
        const paymentMethod = document.querySelector('input[name="checkoutPaymentMethod"]:checked')?.value || 'Cash on Delivery';

        if (reviewBox) {
            reviewBox.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="p-3 border rounded bg-light h-100">
                            <h6 class="fw-bold text-dark mb-2"><i class="bi bi-person-fill text-warning me-1"></i> Customer & Contact</h6>
                            <p class="mb-1 fw-bold">${name}</p>
                            <p class="mb-1 text-muted small"><i class="bi bi-telephone me-1"></i> ${phone}</p>
                            ${instructions ? `<p class="mb-0 text-muted small fst-italic">Note: "${instructions}"</p>` : ''}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 border rounded bg-light h-100">
                            <h6 class="fw-bold text-dark mb-2"><i class="bi bi-geo-alt-fill text-danger me-1"></i> Delivery Address</h6>
                            <p class="mb-1">${address}</p>
                            <p class="mb-0 text-muted small">${city}, ${state} - ${pincode}</p>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="p-3 border rounded bg-light">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="fw-bold text-dark mb-1"><i class="bi bi-wallet2 text-success me-1"></i> Payment Method</h6>
                                    <span class="badge bg-dark">${paymentMethod}</span>
                                </div>
                                <div class="text-end">
                                    <span class="text-muted small d-block">Total to Pay</span>
                                    <span class="fs-4 fw-bold text-success">${formatCurrency(summary.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    placeOrder() {
        const placeBtn = document.getElementById('checkoutPlaceOrderBtn');
        if (placeBtn) {
            placeBtn.disabled = true;
            placeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Placing Order...';
        }

        setTimeout(() => {
            try {
                const items = Cart.getItems();
                if (items.length === 0) {
                    showToast('Your cart is empty!', 'warning');
                    return;
                }

                const name = document.getElementById('checkoutName').value.trim();
                const phone = document.getElementById('checkoutPhone').value.trim();
                const address = document.getElementById('checkoutAddress').value.trim();
                const city = document.getElementById('checkoutCity').value.trim();
                const state = document.getElementById('checkoutState').value.trim();
                const pincode = document.getElementById('checkoutPincode').value.trim();
                const instructions = document.getElementById('checkoutInstructions').value.trim();
                const paymentMethod = document.querySelector('input[name="checkoutPaymentMethod"]:checked')?.value || 'Cash on Delivery';

                const orderPayload = {
                    customer_name: name,
                    delivery_phone: phone,
                    delivery_address: address,
                    delivery_city: city,
                    delivery_state: state,
                    delivery_pincode: pincode,
                    special_instructions: instructions,
                    payment_method: paymentMethod,
                    items: items
                };

                const res = StorageService.placeOrder(orderPayload);

                if (res.success) {
                    // Clear cart
                    Cart.clear();

                    // Close checkout modal
                    const checkoutModalEl = document.getElementById('checkoutModal');
                    const bsModal = bootstrap.Modal.getInstance(checkoutModalEl);
                    if (bsModal) bsModal.hide();

                    // Show confirmation modal
                    this.showConfirmationModal(res.order);
                } else {
                    showToast(res.message || 'Failed to place order.', 'error');
                }
            } catch (err) {
                console.error('Order error:', err);
                showToast('An unexpected error occurred while placing order.', 'error');
            } finally {
                if (placeBtn) {
                    placeBtn.disabled = false;
                    placeBtn.innerHTML = '<i class="bi bi-bag-check-fill me-1"></i> Place Order';
                }
            }
        }, 500);
    },

    showConfirmationModal(orderData) {
        const modalEl = document.getElementById('orderConfirmationModal');
        const detailsEl = document.getElementById('orderConfirmationDetails');

        if (detailsEl) {
            detailsEl.innerHTML = `
                <div class="text-center mb-4">
                    <div class="display-3 text-success mb-2">
                        <i class="bi bi-check-circle-fill"></i>
                    </div>
                    <h3 class="fw-bold">Order Confirmed!</h3>
                    <p class="text-muted">Thank you for your order. Our kitchen has received it and is preparing your delicious meal.</p>
                </div>
                <div class="card bg-light border-0 p-3 mb-3">
                    <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                        <span class="text-muted">Order ID:</span>
                        <span class="fw-bold text-dark">#${orderData.order_id}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                        <span class="text-muted">Status:</span>
                        <span class="badge bg-warning text-dark">${orderData.status}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                        <span class="text-muted">Payment:</span>
                        <span class="fw-bold">${orderData.payment_method}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-0">
                        <span class="text-muted">Total Paid / Payable:</span>
                        <span class="fw-bold fs-5 text-success">${formatCurrency(orderData.total_amount)}</span>
                    </div>
                </div>
                <p class="text-center text-muted small mb-0">
                    <i class="bi bi-truck me-1"></i> Estimated delivery time: <strong>30-40 mins</strong>.
                </p>
            `;
        }

        const bsConfirmModal = new bootstrap.Modal(modalEl);
        bsConfirmModal.show();
    }
};
