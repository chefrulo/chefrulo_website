/** @odoo-module **/

// Add discount badge to product detail page
// Shows compare_list_price (strikethrough) and percentage off

function initProductPageDiscount() {
    // Only run on product pages
    const productPrice = document.querySelector('.product_price .oe_price');
    if (!productPrice) {
        return;
    }

    // Check if already initialized
    if (productPrice._discountInitialized) {
        return;
    }
    productPrice._discountInitialized = true;

    // Get product data from the page
    const priceContainer = productPrice.closest('h3');
    if (!priceContainer) {
        return;
    }

    // Look for existing compare price (might be hidden by groups)
    const existingDel = priceContainer.querySelector('del');

    // Get the compare price from data attributes or from the page
    // The product template ID is in the form
    const productForm = document.querySelector('form[action="/shop/cart/update"]');
    if (!productForm) {
        return;
    }

    const productTemplateId = productForm.querySelector('input.product_template_id');
    if (!productTemplateId) {
        return;
    }

    const templateId = productTemplateId.value;

    // Fetch product data via JSON-RPC
    fetch('/shop/category/products/json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
                category_id: null,
                category_name: null,
                limit: 100,
            },
            id: Math.floor(Math.random() * 1000000),
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (!data.result) return;

        // Find this product in the results
        const product = data.result.find(p => p.id === parseInt(templateId));
        if (!product || !product.compare_price || product.compare_price <= 0) {
            return;
        }

        // Format price
        const formatPrice = (price) => {
            return product.currency_position === 'before'
                ? product.currency_symbol + ' ' + price.toFixed(2)
                : price.toFixed(2) + ' ' + product.currency_symbol;
        };

        // Create discount elements
        const discountHtml = `
            <del class="text-muted ms-2 h5" style="white-space: nowrap;">${formatPrice(product.compare_price)}</del>
            <span class="text-success ms-2" style="font-size: 1rem; font-weight: 500;">${product.discount_percent}% off</span>
        `;

        // Insert after the price
        productPrice.insertAdjacentHTML('afterend', discountHtml);
    })
    .catch(err => {
        console.log('Could not load discount info:', err);
    });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductPageDiscount);
} else {
    setTimeout(initProductPageDiscount, 100);
}
