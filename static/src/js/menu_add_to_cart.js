/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";

publicWidget.registry.MenuAddToCart = publicWidget.Widget.extend({
    selector: '.js_menu_add_to_cart',
    events: {
        'click .js_menu_cart_btn': '_onAddToCart',
    },

    _onAddToCart: function (ev) {
        ev.preventDefault();
        var $btn = $(ev.currentTarget);
        var productId = parseInt($btn.data('product-id'));
        var $form = $btn.closest('.js_menu_add_to_cart');
        var qty = parseInt($form.find('input[name="add_qty"]').val()) || 1;

        $btn.prop('disabled', true);
        var originalHtml = $btn.html();
        $btn.html('<i class="fa fa-spinner fa-spin"/>');

        jsonrpc('/shop/cart/update_json', {
            product_id: productId,
            add_qty: qty,
        }).then(function (data) {
            // Update cart badge in navbar
            var cartQty = data.cart_quantity || 0;
            $('sup.my_cart_quantity').text(cartQty).toggle(cartQty > 0);
            // Show success feedback
            $btn.html('<i class="fa fa-check me-1"/> Added');
            $btn.removeClass('btn-primary').addClass('btn-success');
            setTimeout(function () {
                $btn.html(originalHtml);
                $btn.removeClass('btn-success').addClass('btn-primary');
                $btn.prop('disabled', false);
            }, 1500);
        }).catch(function () {
            $btn.html(originalHtml);
            $btn.prop('disabled', false);
        });
    },
});

export default publicWidget.registry.MenuAddToCart;
