from odoo import models
from odoo.osv import expression


class WebsiteSnippetFilter(models.Model):
    """
    Override website.snippet.filter to use product.template instead of product.product.
    This groups variants together instead of showing each variant as a separate product.
    """
    _inherit = 'website.snippet.filter'

    def _get_products(self, mode, context):
        """
        Override to return product.template records instead of product.product variants.
        This ensures products with variants show up once (grouped) instead of multiple times.
        """
        website = self.env['website'].get_current_website()
        limit = context.get('limit', 16)

        # Base domain for published products
        domain = [
            ('is_published', '=', True),
            ('sale_ok', '=', True),
        ]

        # Add website domain if multi-website
        if hasattr(self.env['product.template'], 'website_id'):
            domain = expression.AND([domain, website.website_domain()])

        # Handle different modes
        if mode == 'latest_sold':
            return self._get_templates_latest_sold(website, limit, domain, context)
        elif mode == 'latest_viewed':
            return self._get_templates_latest_viewed(website, limit, domain, context)
        else:
            # For other modes, fall back to original behavior
            return super()._get_products(mode, context)

    def _get_templates_latest_sold(self, website, limit, domain, context):
        """
        Get recently sold product TEMPLATES (not variants).
        Groups variants together by only returning their parent templates.
        """
        # Find recent sale order lines
        sale_lines = self.env['sale.order.line'].sudo().search([
            ('order_id.state', 'in', ['sale', 'done']),
            ('order_id.website_id', '=', website.id),
        ], limit=100, order='create_date desc')

        # Get unique product templates from these sales
        template_ids = sale_lines.mapped('product_id.product_tmpl_id').ids

        if template_ids:
            # Maintain order by recent sales while filtering by domain
            templates = self.env['product.template'].sudo().search(
                expression.AND([domain, [('id', 'in', template_ids)]]),
                limit=limit,
            )
            # Sort by original order (most recently sold first)
            template_order = {tid: idx for idx, tid in enumerate(template_ids)}
            templates = templates.sorted(key=lambda t: template_order.get(t.id, 999))
        else:
            # No recent sales, fall back to newest products
            templates = self.env['product.template'].sudo().search(
                domain, limit=limit, order='create_date desc'
            )

        return templates

    def _get_templates_latest_viewed(self, website, limit, domain, context):
        """
        Get recently viewed product TEMPLATES.
        Falls back to newest products if no view history.
        """
        # Try to get from visitor history
        visitor = self.env['website.visitor']._get_visitor_from_request()

        if visitor:
            # Get product templates from visitor's viewed products
            viewed_products = visitor.sudo().product_ids
            template_ids = viewed_products.mapped('product_tmpl_id').ids

            if template_ids:
                templates = self.env['product.template'].sudo().search(
                    expression.AND([domain, [('id', 'in', template_ids)]]),
                    limit=limit,
                )
                # Sort by view order
                template_order = {tid: idx for idx, tid in enumerate(template_ids)}
                templates = templates.sorted(key=lambda t: template_order.get(t.id, 999))
                return templates

        # Fall back to newest products
        return self.env['product.template'].sudo().search(
            domain, limit=limit, order='create_date desc'
        )

    def _filter_records_to_values(self, records, is_sample=False):
        """
        Override to handle product.template records in addition to product.product.
        """
        if records and records._name == 'product.template':
            # Handle product.template records
            res = []
            for template in records:
                # Get the first variant for pricing info
                first_variant = template.product_variant_id or template.product_variant_ids[:1]

                values = {
                    '_record': template,
                    'id': template.id,
                    'display_name': template.name,
                    'description_sale': template.description_sale or '',
                    'image_512': f'/web/image/product.template/{template.id}/image_512',
                    'website_url': template.website_url,
                    # Price info from first variant
                    'list_price': template.list_price,
                    'has_variants': template.product_variant_count > 1,
                    'variant_count': template.product_variant_count,
                }

                # Add combination info if available
                if first_variant:
                    try:
                        combo_info = first_variant._get_combination_info_variant()
                        values.update(combo_info)
                    except Exception:
                        pass

                res.append(values)
            return res

        # Fall back to original behavior for product.product
        return super()._filter_records_to_values(records, is_sample)
