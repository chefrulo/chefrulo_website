import logging
import requests

from odoo import models, fields, api

_logger = logging.getLogger(__name__)


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

    delivery_date = fields.Char(
        string='Delivery/Pickup Date',
        help='Date chosen by the customer during checkout'
    )
    shipping_note = fields.Text(
        string='Shipping Notes',
        help='Special instructions from the customer'
    )

    def send_internal_sms_notification(self):
        """Send SMS notification to internal staff when a new order is confirmed.
        Recipients are configured via Settings > Technical > System Parameters
        key: chefrulo.sms_notification_partner_ids (comma-separated partner IDs)
        """
        param = self.env['ir.config_parameter'].sudo().get_param(
            'chefrulo.sms_notification_partner_ids', ''
        )
        if not param:
            _logger.warning("chefrulo.sms_notification_partner_ids not set in System Parameters")
            return

        partner_ids = [int(x.strip()) for x in param.split(',') if x.strip().isdigit()]
        if not partner_ids:
            return

        partners = self.env['res.partner'].sudo().browse(partner_ids)
        company = self.env.company.sudo()

        for order in self:
            lines = '\n'.join(
                f"- {line.product_id.name} x{int(line.product_uom_qty)}"
                for line in order.order_line
            )
            base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
            order_url = f"{base_url}/odoo/sales/{order.id}"
            message = (
                f"New order {order.name}\n"
                f"Customer: {order.partner_id.name}\n"
                f"Bill to: {order.partner_invoice_id.contact_address}\n"
                f"Payment Method: {order.transaction_ids[:1].payment_id.journal_id.name or '-'}\n"
                f"Ship to: {order.partner_shipping_id.contact_address}\n"
                f"Shipping Method: {order.carrier_id.name or 'Free'}\n"
                f"Shipping Description: {order.carrier_id.carrier_description or '-'}\n"
                f"Shipping Date: {order.delivery_date or 'Not Set'}\n"
                f"Shipping Note: {order.shipping_note or 'No Notes'}\n"
                f"Total: £{order.amount_total:.2f}\n"
                f"{lines}\n"
                f"{order_url}"
            )

            for partner in partners:
                number = partner.mobile or partner.phone
                if not number:
                    _logger.warning("Partner %s (id=%s) has no phone/mobile", partner.name, partner.id)
                    continue
                try:
                    requests.post(
                        f'https://api.twilio.com/2010-04-01/Accounts/{company.sms_twilio_account_sid}/Messages.json',
                        data={
                            'From': company.sms_twilio_number_ids[0].number,
                            'To': number,
                            'Body': message,
                        },
                        auth=(company.sms_twilio_account_sid, company.sms_twilio_auth_token),
                        timeout=10,
                    )
                    _logger.info("SMS notification sent to %s (%s) for order %s", partner.name, number, order.name)
                except Exception as e:
                    _logger.error("Failed to send SMS to %s: %s", number, str(e))

    def get_available_delivery_dates(self):
        """Return list of next 5 Mon-Fri working day labels from tomorrow."""
        from datetime import date, timedelta
        today = date.today()
        dates = []
        d = today + timedelta(days=1)
        while len(dates) < 5:
            if d.weekday() < 5:  # 0=Mon ... 4=Fri
                dates.append(d.strftime('%A %-d %B'))
            d += timedelta(days=1)
        return dates
