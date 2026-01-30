from odoo import fields, models


class Website(models.Model):
    _inherit = "website"

    enable_request_quote = fields.Boolean(
        string="Enable Request Quote",
        default=False,
        help="Show 'Request a Quote' button on the shop cart and payment pages.",
    )
