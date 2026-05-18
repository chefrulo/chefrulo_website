from odoo import fields, models


class EventEventTicket(models.Model):
    _inherit = 'event.event.ticket'

    compare_price = fields.Monetary(
        string="Compare Price",
        currency_field='currency_id',
        help="Original price shown as strikethrough to highlight savings.",
    )
