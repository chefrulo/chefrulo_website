/** @odoo-module **/

/**
 * Filter shipping address form to show only UK and London
 */
document.addEventListener('DOMContentLoaded', function() {
    filterShippingAddress();

    // Also observe for dynamic content
    const observer = new MutationObserver(function() {
        filterShippingAddress();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

function filterShippingAddress() {
    // Check if we're on a shipping address form
    const shippingHeader = document.querySelector('h3, h2, h1');
    const isShippingPage = shippingHeader &&
        (shippingHeader.textContent.toLowerCase().includes('shipping') ||
         document.querySelector('select[name="country_id"][mode="shipping"]'));

    if (!isShippingPage) return;

    const countrySelect = document.querySelector('select[name="country_id"]');
    if (!countrySelect) return;

    // Check if already filtered
    if (countrySelect.dataset.ukFiltered === 'true') return;

    // Find UK option and keep only that
    const options = countrySelect.querySelectorAll('option');
    let ukOption = null;
    let ukFound = false;

    options.forEach(function(opt) {
        // UK country codes: GB, UK
        const text = opt.textContent.toLowerCase();
        if (text.includes('united kingdom') || text.includes('great britain') ||
            opt.getAttribute('data-code') === 'GB') {
            ukOption = opt;
            ukFound = true;
        }
    });

    if (ukFound && ukOption) {
        // Remove all options except the placeholder and UK
        options.forEach(function(opt) {
            if (opt.value === '' || opt === ukOption) {
                // Keep placeholder and UK
            } else {
                opt.remove();
            }
        });

        // Auto-select UK
        countrySelect.value = ukOption.value;
        countrySelect.dataset.ukFiltered = 'true';

        // Trigger change event to load states
        countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// Also filter states when they load
document.addEventListener('change', function(e) {
    if (e.target && e.target.name === 'country_id') {
        setTimeout(filterStates, 500);
    }
});

function filterStates() {
    const stateSelect = document.querySelector('select[name="state_id"]');
    if (!stateSelect) return;

    // Check if already filtered
    if (stateSelect.dataset.londonFiltered === 'true') return;

    const options = stateSelect.querySelectorAll('option');
    let londonOption = null;

    options.forEach(function(opt) {
        const text = opt.textContent.toLowerCase();
        if (text.includes('london')) {
            londonOption = opt;
        }
    });

    if (londonOption) {
        // Remove all options except placeholder and London
        options.forEach(function(opt) {
            if (opt.value === '' || opt === londonOption) {
                // Keep placeholder and London
            } else {
                opt.remove();
            }
        });

        // Auto-select London
        stateSelect.value = londonOption.value;
        stateSelect.dataset.londonFiltered = 'true';
    }
}
