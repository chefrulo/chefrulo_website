from odoo import http
from odoo.http import request


class WebsiteMenu(http.Controller):

    @http.route('/menu', type='http', auth='public', website=True)
    def menu_page(self, **post):
        """Display a catalog/menu page with all categories and products."""
        return self._render_menu_page()

    @http.route('/catering', type='http', auth='public', website=True)
    def catering_page(self, **post):
        """Display only Catering category and its subcategories/products."""
        return self._render_menu_page(category_filter='Catering')

    def _render_menu_page(self, category_filter=None):
        """Display a catalog/menu page with categories and products."""
        website = request.website
        Category = request.env['product.public.category'].sudo()
        Product = request.env['product.template'].sudo()

        # Get categories based on filter
        if category_filter:
            # Find the specific category by name
            domain = [('name', '=', category_filter)]
            if hasattr(Category, 'website_id'):
                domain += website.website_domain()
            categories = Category.search(domain, order='sequence, name')
        else:
            # Get all top-level categories (no parent)
            domain = [('parent_id', '=', False)]
            if hasattr(Category, 'website_id'):
                domain += website.website_domain()
            categories = Category.search(domain, order='sequence, name')

        # Build category data with subcategories and their products
        menu_data = []
        for cat in categories:
            subcategories = []
            children = cat.child_id.sorted(key=lambda c: (c.sequence, c.name))
            if children:
                for subcat in children:
                    products = Product.search([
                        ('public_categ_ids', 'in', [subcat.id]),
                        ('is_published', '=', True),
                        ('sale_ok', '=', True),
                    ], order='name')
                    if products:
                        subcategories.append({
                            'category': subcat,
                            'products': products,
                        })
            else:
                # No subcategories - show products directly under this category
                products = Product.search([
                    ('public_categ_ids', 'in', [cat.id]),
                    ('is_published', '=', True),
                    ('sale_ok', '=', True),
                ], order='name')
                if products:
                    subcategories.append({
                        'category': cat,
                        'products': products,
                    })

            if subcategories:
                menu_data.append({
                    'category': cat,
                    'subcategories': subcategories,
                })

        values = {
            'menu_data': menu_data,
        }
        return request.render('chefrulo_website.menu_page', values)


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
