/** @odoo-module **/

import { jsonrpc } from "@web/core/network/rpc_service";

console.log('Dynamic products snippet JS loaded');

function initDynamicProductsSnippets() {
    const snippets = document.querySelectorAll('.s_dynamic_products_templates');
    console.log('Found', snippets.length, 'dynamic product snippets');

    snippets.forEach(function(snippet) {
        // Skip if already initialized
        if (snippet.dataset.initialized === 'true') {
            return;
        }
        snippet.dataset.initialized = 'true';

        const categoryId = snippet.dataset.categoryId;
        const categoryName = snippet.dataset.categoryName || 'Frozen';
        const limit = parseInt(snippet.dataset.limit) || 8;
        const container = snippet.querySelector('.products-container');

        console.log('Loading products for category:', categoryName, 'limit:', limit);

        if (!container) {
            console.error('No .products-container found in snippet');
            return;
        }

        // Show loading
        container.innerHTML = '<div class="text-center py-5"><i class="fa fa-spinner fa-spin fa-2x"></i></div>';

        // Fetch products
        jsonrpc('/shop/category/products/json', {
            category_id: categoryId,
            category_name: categoryName,
            limit: limit,
        }).then(function(products) {
            console.log('Received', products.length, 'products');
            renderProducts(container, products);
        }).catch(function(error) {
            console.error('Error loading products:', error);
            container.innerHTML = '<div class="text-center py-5 text-muted">Could not load products</div>';
        });
    });
}

function renderProducts(container, products) {
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-muted">No products found</div>';
        return;
    }

    let html = '<div class="row g-4">';

    products.forEach(function(product) {
        const priceFormatted = product.currency_position === 'before'
            ? product.currency_symbol + ' ' + product.price.toFixed(2)
            : product.price.toFixed(2) + ' ' + product.currency_symbol;

        html += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card h-100 product-template-card">
                    <a href="${product.url}" class="d-block overflow-hidden" style="height: 200px;">
                        <img src="${product.image_url}"
                             alt="${product.name}"
                             class="card-img-top h-100 w-100"
                             style="object-fit: cover;"/>
                    </a>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title mb-2">
                            <a href="${product.url}" class="text-decoration-none text-reset">
                                ${product.name}
                            </a>
                        </h6>
                        <p class="mb-2">
                            <span class="fw-bold">${priceFormatted}</span>
                            ${product.has_variants ? '<span class="text-muted small ms-1">from</span>' : ''}
                        </p>
                        <div class="mt-auto">
                            <a href="${product.url}" class="btn btn-primary btn-sm w-100">
                                ${product.has_variants ? 'Choose Options' : 'View Product'}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDynamicProductsSnippets);
} else {
    setTimeout(initDynamicProductsSnippets, 100);
}

// Also watch for new snippets added to the page (for Website Builder)
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
            setTimeout(initDynamicProductsSnippets, 100);
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });
