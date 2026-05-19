from odoo import fields, models


class EventType(models.Model):
    _inherit = 'event.type'

    use_full_width_layout = fields.Boolean(
        string="Full Width Layout",
        help="Hide the right sidebar on the event page. Add Book buttons in the "
             "description with data-bs-target='#modal_ticket_registration'.",
    )
