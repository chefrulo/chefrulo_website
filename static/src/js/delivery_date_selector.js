/**
 * Delivery Date Selector
 * - Updates info text when carrier radio changes (delivery vs pickup)
 * - Saves delivery_date and shipping_note to the order via AJAX on change
 * - Validates that a date is selected before allowing payment
 */
(function () {
    'use strict';

    function isPickup(radioEl) {
        const label = document.querySelector('label[for="' + radioEl.id + '"]');
        if (!label) {
            console.warn('delivery_date_selector: no label found for radio id=', radioEl.id);
        }
        const name = label ? label.textContent.toLowerCase() : '';
        return name.includes('take away') || name.includes('pickup') || name.includes('pick up');
    }

    function updateInfoText(pickupType) {
        const deliveryInfo = document.getElementById('delivery_info_delivery');
        const pickupInfo = document.getElementById('delivery_info_pickup');
        if (!deliveryInfo || !pickupInfo) return;
        if (pickupType) {
            deliveryInfo.classList.add('d-none');
            pickupInfo.classList.remove('d-none');
        } else {
            pickupInfo.classList.add('d-none');
            deliveryInfo.classList.remove('d-none');
        }
    }

    function saveDeliveryInfo(params) {
        fetch('/shop/save_delivery_info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                id: Date.now(),
                params: params,
            }),
        }).catch(function (err) {
            console.error('delivery_date_selector: failed to save delivery info', err);
        });
    }

    function init() {
        const dateBlock = document.getElementById('delivery_date_block');
        if (!dateBlock) return; // not on payment page

        const dateSelect = document.getElementById('delivery_date_select');
        const noteTextarea = document.getElementById('shipping_note_input');
        const errorDiv = document.getElementById('delivery_date_error');
        const carrierRadios = document.querySelectorAll('input[name="delivery_type"]');

        // Set initial info text from pre-selected carrier
        const checkedRadio = document.querySelector('input[name="delivery_type"]:checked');
        if (checkedRadio) {
            updateInfoText(isPickup(checkedRadio));
        }

        // Carrier change: update info text
        carrierRadios.forEach(function (radio) {
            radio.addEventListener('change', function () {
                updateInfoText(isPickup(this));
            });
        });

        // Date select change: save to order
        if (dateSelect) {
            dateSelect.addEventListener('change', function () {
                if (this.value) {
                    if (errorDiv) errorDiv.classList.add('d-none');
                    saveDeliveryInfo({ delivery_date: this.value });
                }
            });
        }

        // Shipping note blur: save to order
        if (noteTextarea) {
            noteTextarea.addEventListener('blur', function () {
                saveDeliveryInfo({ shipping_note: this.value });
            });
        }

        // Pay button validation: require a date before payment proceeds
        document.addEventListener('click', function (e) {
            const btn = e.target.closest(
                '.o_payment_submit_button, [name="o_payment_submit_button"]'
            );
            if (!btn) return;
            if (dateSelect && !dateSelect.value) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (errorDiv) errorDiv.classList.remove('d-none');
                dateSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
                dateSelect.focus();
            }
        }, true); // capture phase fires before Odoo payment JS
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
