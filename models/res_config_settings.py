from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    enable_request_quote = fields.Boolean(
        related="website_id.enable_request_quote",
        readonly=False,
    )
