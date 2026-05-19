from odoo import fields, models


class EventEvent(models.Model):
    _inherit = 'event.event'

    use_full_width_layout = fields.Boolean(
        string="Full Width Layout",
        help="Hide the right sidebar and show content full-width. "
             "Use 'Book Now' buttons in the description to open the registration popup.",
    )
