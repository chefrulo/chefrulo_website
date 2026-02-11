from odoo import models, fields, api


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    has_catering_products = fields.Boolean(
        compute='_compute_has_catering_products',
        string='Has Catering Products',
        help='True if any product in this order belongs to the Catering category or its subcategories'
    )

    @api.depends('order_line.product_id', 'order_line.product_id.public_categ_ids')
    def _compute_has_catering_products(self):
        """Check if any product in the order belongs to Catering category or subcategories."""
        Category = self.env['product.public.category'].sudo()

        # Find the Catering category
        catering_category = Category.search([('name', '=', 'Catering')], limit=1)

        if not catering_category:
            for order in self:
                order.has_catering_products = False
            return

        # Get all Catering subcategories (recursively)
        def get_all_child_ids(category):
            """Get all child category IDs recursively."""
            ids = [category.id]
            for child in category.child_id:
                ids.extend(get_all_child_ids(child))
            return ids

        catering_category_ids = set(get_all_child_ids(catering_category))

        for order in self:
            has_catering = False
            for line in order.order_line:
                if line.product_id and line.product_id.product_tmpl_id:
                    product_category_ids = set(line.product_id.product_tmpl_id.public_categ_ids.ids)
                    if product_category_ids & catering_category_ids:
                        has_catering = True
                        break
            order.has_catering_products = has_catering
