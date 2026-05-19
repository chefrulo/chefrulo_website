from odoo import api, fields, models


class EventType(models.Model):
    _inherit = 'event.type'

    use_full_width_layout = fields.Boolean(
        string="Full Width Layout",
        help="Hide the right sidebar on the event page. Add Book buttons in the "
             "description with data-bs-target='#modal_ticket_registration'.",
    )


class EventEvent(models.Model):
    _inherit = 'event.event'

    # Stored computed field so public users can read it without needing
    # access to event.type records.
    use_full_width_layout = fields.Boolean(
        compute='_compute_use_full_width_layout',
        store=True,
    )

    @api.depends('event_type_id.use_full_width_layout')
    def _compute_use_full_width_layout(self):
        for event in self:
            event.use_full_width_layout = event.event_type_id.use_full_width_layout
