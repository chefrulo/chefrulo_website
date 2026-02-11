import logging
from odoo import models

_logger = logging.getLogger(__name__)


class ResCountry(models.Model):
    _inherit = 'res.country'

    def get_website_sale_countries(self, mode='billing'):
        """Override to restrict shipping countries to UK only."""
        _logger.info("get_website_sale_countries called with mode=%s", mode)
        if mode == 'shipping':
            # Return only United Kingdom for shipping
            uk = self.sudo().search([('code', '=', 'GB')], limit=1)
            _logger.info("Returning UK only: %s", uk)
            return uk
        return super().get_website_sale_countries(mode=mode)

    def get_website_sale_states(self, mode='billing'):
        """Override to restrict shipping states to London only."""
        _logger.info("get_website_sale_states called with mode=%s, country=%s", mode, self.code)
        if mode == 'shipping':
            # For shipping, only return London (for UK)
            if self.code == 'GB':
                london = self.env['res.country.state'].sudo().search([
                    ('country_id', '=', self.id),
                    ('name', 'ilike', 'London'),
                ])
                _logger.info("Returning London only: %s", london)
                return london
            # For non-UK countries in shipping mode, return empty
            return self.env['res.country.state']
        return super().get_website_sale_states(mode=mode)
