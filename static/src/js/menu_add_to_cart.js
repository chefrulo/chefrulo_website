/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";

// Menu Search Filter - inject search bar dynamically
publicWidget.registry.MenuSearch = publicWidget.Widget.extend({
    selector: '.js_menu_add_to_cart',

    start: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            self._injectSearchBar();
        });
    },

    _injectSearchBar: function () {
        // Only inject once, and only on catering/menu pages
        if ($('#menu_search_injected').length) return;
        if (!window.location.pathname.includes('/catering') && !window.location.pathname.includes('/menu')) return;

        // Find the container with products
        var $container = this.$el.closest('.container');
        if (!$container.length) return;

        // Create and inject search bar at the top of container
        var searchHtml = `
            <div id="menu_search_injected" class="row justify-content-center mb-4">
                <div class="col-md-6">
                    <div class="input-group">
                        <span class="input-group-text bg-white border-end-0">
                            <i class="fa fa-search text-muted"></i>
                        </span>
                        <input type="text"
                               id="menu_search"
                               class="form-control border-start-0"
                               placeholder="Search products..."/>
                    </div>
                </div>
            </div>
        `;

        // Insert at the beginning of the container
        $container.prepend(searchHtml);

        // Bind search event
        $('#menu_search').on('input', this._onSearch.bind(this));
    },

    _onSearch: function (ev) {
        var searchTerm = ev.target.value.toLowerCase().trim();
        // Find product rows by looking at rows with add to cart forms
        var $products = $('.js_menu_add_to_cart').closest('.row.align-items-center');
        var $sections = $('.mb-5');

        if (!searchTerm) {
            // Show all products and categories
            $products.show();
            $sections.show();
            return;
        }

        // Filter products
        $products.each(function () {
            var $row = $(this);
            var name = $row.find('h5').text().toLowerCase();
            var desc = $row.find('p.text-muted').text().toLowerCase();

            if (name.includes(searchTerm) || desc.includes(searchTerm)) {
                $row.show();
            } else {
                $row.hide();
            }
        });

        // Hide empty sections
        $sections.each(function () {
            var $section = $(this);
            var visibleProducts = $section.find('.js_menu_add_to_cart:visible').length;
            if (visibleProducts === 0) {
                $section.hide();
            } else {
                $section.show();
            }
        });
    },
});

publicWidget.registry.MenuAddToCart = publicWidget.Widget.extend({
    selector: '.js_menu_add_to_cart',
    events: {
        'click .js_menu_cart_btn': '_onAddToCart',
    },

    start: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            // Check if we're on the catering page and update button text
            self._updateButtonText();
        });
    },

    _updateButtonText: function () {
        var isCateringPage = window.location.pathname.includes('/catering');
        var $btn = this.$('.js_menu_cart_btn');

        if (isCateringPage && $btn.length) {
            // Change button text to "Add to quote" on catering page
            $btn.html('Add to quote');
        }
    },

    _onAddToCart: function (ev) {
        ev.preventDefault();
        var self = this;
        var $btn = $(ev.currentTarget);
        var productId = parseInt($btn.data('product-id'));
        var $form = $btn.closest('.js_menu_add_to_cart');
        var qty = parseInt($form.find('input[name="add_qty"]').val()) || 1;
        var isCateringPage = window.location.pathname.includes('/catering');

        $btn.prop('disabled', true);
        var originalText = isCateringPage ? 'Add to quote' : 'Add to cart';
        $btn.html('<i class="fa fa-spinner fa-spin"/>');

        jsonrpc('/shop/cart/update_json', {
            product_id: productId,
            add_qty: qty,
        }).then(function (data) {
            // Update cart badge in navbar
            var cartQty = data.cart_quantity || 0;
            $('sup.my_cart_quantity').text(cartQty).toggle(cartQty > 0);
            // Show success feedback
            var addedText = isCateringPage ? 'Added to quote' : 'Added';
            $btn.html('<i class="fa fa-check me-1"/> ' + addedText);
            $btn.addClass('text-success');
            setTimeout(function () {
                $btn.html(originalText);
                $btn.removeClass('text-success');
                $btn.prop('disabled', false);
            }, 1500);
        }).catch(function () {
            $btn.html(originalText);
            $btn.prop('disabled', false);
        });
    },
});

export default publicWidget.registry.MenuAddToCart;
