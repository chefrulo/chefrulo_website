/** @odoo-module **/

/**
 * Restrict address forms (billing AND shipping) to UK / Greater London only.
 * Applies to any page under /shop/ that has a country_id select.
 */

function isAddressPage() {
    return window.location.pathname.startsWith('/shop');
}

function filterCountrySelect() {
    if (!isAddressPage()) return;

    const countrySelect = document.querySelector('select[name="country_id"]');
    if (!countrySelect) return;
    if (countrySelect.dataset.ukFiltered === 'true') return;

    const options = countrySelect.querySelectorAll('option');
    let ukOption = null;

    options.forEach(function (opt) {
        const text = opt.textContent.toLowerCase();
        if (text.includes('united kingdom') || text.includes('great britain') ||
                opt.getAttribute('data-code') === 'GB') {
            ukOption = opt;
        }
    });

    if (!ukOption) return;

    // Keep only the placeholder and UK
    options.forEach(function (opt) {
        if (opt.value !== '' && opt !== ukOption) {
            opt.remove();
        }
    });

    countrySelect.value = ukOption.value;
    countrySelect.dataset.ukFiltered = 'true';
    countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
}

function filterStateSelect() {
    if (!isAddressPage()) return;

    const stateSelect = document.querySelector('select[name="state_id"]');
    if (!stateSelect) return;
    if (stateSelect.dataset.londonFiltered === 'true') return;

    const options = stateSelect.querySelectorAll('option');
    let londonOption = null;

    options.forEach(function (opt) {
        const text = opt.textContent.trim().toLowerCase();
        if (text === 'london' || text === 'greater london') {
            londonOption = opt;
        }
    });

    if (!londonOption) return;

    // Keep only the placeholder and London
    options.forEach(function (opt) {
        if (opt.value !== '' && opt !== londonOption) {
            opt.remove();
        }
    });

    stateSelect.value = londonOption.value;
    stateSelect.dataset.londonFiltered = 'true';
}

// Re-run filters after country change (state select loads dynamically)
document.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'country_id') {
        setTimeout(filterStateSelect, 500);
    }
});

// Initial run + observe dynamic content
document.addEventListener('DOMContentLoaded', function () {
    filterCountrySelect();
    filterStateSelect();

    const observer = new MutationObserver(function () {
        filterCountrySelect();
        filterStateSelect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
