from odoo import http
from odoo.http import request


class WebsiteQuotation(http.Controller):

    @http.route('/shop/request_quotation', type='http', auth='public', website=True)
    def request_quotation(self, **post):
        order = request.website.sale_get_order()
        if not order or not order.order_line:
            return request.redirect('/shop/cart')

        # If customer hasn't filled in their address yet, send them to checkout first
        if not order.partner_id or order.partner_id == request.website.partner_id:
            # Store a flag so after checkout we redirect to quote instead of payment
            request.session['request_quotation_after_checkout'] = True
            return request.redirect('/shop/checkout?express=1')

        # Mark the quotation as sent (changes state from draft to sent)
        order.sudo().action_quotation_sent()

        # Store the order id for the confirmation page
        request.session['sale_last_order_id'] = order.id

        # Clear the cart so the customer starts fresh
        request.session['sale_order_id'] = False

        return request.redirect('/shop/quotation/confirmation')

    @http.route('/shop/quotation/confirmation', type='http', auth='public', website=True)
    def quotation_confirmation(self, **post):
        sale_order_id = request.session.get('sale_last_order_id')
        if not sale_order_id:
            return request.redirect('/shop')

        order = request.env['sale.order'].sudo().browse(sale_order_id).exists()
        if not order:
            return request.redirect('/shop')

        values = {
            'order': order,
        }
        return request.render('chefrulo_website.quotation_confirmation', values)
