/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";

publicWidget.registry.DynamicProductsSnippet = publicWidget.Widget.extend({
    selector: '.s_dynamic_products_templates',

    start: function () {
        var self = this;
        var $el = this.$el;
        var categoryId = $el.data('category-id');
        var categoryName = $el.data('category-name') || 'Frozen';
        var limit = $el.data('limit') || 8;

        // Show loading
        $el.find('.products-container').html(
            '<div class="text-center py-5"><i class="fa fa-spinner fa-spin fa-2x"></i></div>'
        );

        // Fetch products
        jsonrpc('/shop/category/products/json', {
            category_id: categoryId,
            category_name: categoryName,
            limit: limit,
        }).then(function (products) {
            self._renderProducts(products);
        }).catch(function () {
            $el.find('.products-container').html(
                '<div class="text-center py-5 text-muted">Could not load products</div>'
            );
        });

        return this._super.apply(this, arguments);
    },

    _renderProducts: function (products) {
        var $container = this.$el.find('.products-container');

        if (!products || products.length === 0) {
            $container.html('<div class="text-center py-5 text-muted">No products found</div>');
            return;
        }

        var html = '<div class="row g-4">';

        products.forEach(function (product) {
            var priceFormatted = product.currency_position === 'before'
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
        $container.html(html);
    },
});

export default publicWidget.registry.DynamicProductsSnippet;
