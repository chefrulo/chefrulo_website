/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";

// Menu Search Filter
publicWidget.registry.MenuSearch = publicWidget.Widget.extend({
    selector: '#menu_search',
    events: {
        'input': '_onSearch',
    },

    _onSearch: function (ev) {
        var searchTerm = ev.target.value.toLowerCase().trim();
        var $products = $('.menu-product-row');
        var $categories = $('h4.text-muted');
        var $sections = $('.mb-5');

        if (!searchTerm) {
            // Show all products and categories
            $products.show();
            $categories.show();
            $sections.show();
            return;
        }

        // Filter products
        $products.each(function () {
            var $row = $(this);
            var name = $row.data('product-name') || '';
            var desc = $row.data('product-desc') || '';

            if (name.includes(searchTerm) || desc.includes(searchTerm)) {
                $row.show();
            } else {
                $row.hide();
            }
        });

        // Hide empty categories
        $sections.each(function () {
            var $section = $(this);
            var visibleProducts = $section.find('.menu-product-row:visible').length;
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
