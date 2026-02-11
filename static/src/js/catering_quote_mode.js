/** @odoo-module **/

// Hide payment buttons (Google Pay, Stripe express checkout) when in catering quote mode

function hideCateringPaymentButtons() {
    // Check if we're in catering quote mode
    const quoteMode = document.querySelector('.o_catering_quote_mode');
    if (!quoteMode) {
        return;
    }

    // Hide all payment-related elements
    const selectors = [
        '.ElementsApp',
        '.GooglePayButton',
        '[class*="express-checkout"]',
        '.o_express_checkout_form',
        '.stripe-element',
        'iframe[name*="stripe"]',
        'iframe[src*="stripe"]',
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
        });
    });
}

function initCateringQuoteMode() {
    // Initial hide
    hideCateringPaymentButtons();

    // Watch for dynamically added payment elements
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Delay slightly to ensure elements are fully rendered
                setTimeout(hideCateringPaymentButtons, 50);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCateringQuoteMode);
} else {
    initCateringQuoteMode();
}
