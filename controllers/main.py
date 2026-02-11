from odoo import http
from odoo.http import request


class WebsiteMenu(http.Controller):

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
            'is_catering': category_filter == 'Catering',
        }
        return request.render('chefrulo_website.menu_page', values)


class WebsiteProductsAPI(http.Controller):
    """JSON API for dynamic product snippets."""

    @http.route('/shop/category/products/json', type='json', auth='public', website=True)
    def get_category_products(self, category_id=None, category_name=None, limit=8, **kwargs):
        """Return product templates (not variants) for a category as JSON."""
        Product = request.env['product.template'].sudo()
        Category = request.env['product.public.category'].sudo()
        website = request.website

        domain = [
            ('is_published', '=', True),
            ('sale_ok', '=', True),
        ]

        # Filter by category
        if category_id:
            domain.append(('public_categ_ids', 'in', [int(category_id)]))
        elif category_name:
            category = Category.search([('name', '=', category_name)], limit=1)
            if category:
                domain.append(('public_categ_ids', 'in', [category.id]))

        products = Product.search(domain, limit=limit, order='name')

        result = []
        for product in products:
            # Get prices - for templates with variants, list_price may vary
            current_price = product.list_price
            compare_price = product.compare_list_price if hasattr(product, 'compare_list_price') else 0
            compare_price = compare_price or 0

            # Calculate discount percentage
            discount_percent = 0
            if compare_price > current_price and current_price > 0:
                discount_percent = round((1 - current_price / compare_price) * 100)

            result.append({
                'id': product.id,
                'name': product.name,
                'description': product.description_sale or '',
                'price': current_price,
                'compare_price': compare_price if compare_price > current_price else 0,
                'discount_percent': discount_percent,
                'currency_symbol': website.currency_id.symbol,
                'currency_position': website.currency_id.position,
                'image_url': f'/web/image/product.template/{product.id}/image_256',
                'url': f'/shop/{product.id}',
                'has_variants': product.product_variant_count > 1,
                'variant_count': product.product_variant_count,
            })

        return result


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
