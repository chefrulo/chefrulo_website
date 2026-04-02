import logging
import re

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class TwilioInboundSMS(http.Controller):

    @http.route('/twilio/inbound-sms', type='http', auth='public', methods=['POST'], csrf=False)
    def inbound_sms(self, **kwargs):
        from_number = kwargs.get('From', '').strip()
        body = kwargs.get('Body', '').strip()

        if not from_number or not body:
            return self._twiml_response()

        _logger.info("Twilio inbound SMS from %s: %s", from_number, body)

        partner = self._find_partner(from_number, None)

        if partner:
            partner.sudo().message_post(
                body=f"<b>SMS recibido:</b> {body}",
                message_type='sms',
                subtype_xmlid='mail.mt_note',
                author_id=partner.id,
            )
            _logger.info("SMS logged to partner: %s (id=%s)", partner.name, partner.id)
        else:
            # No partner found — log to the general SMS channel or just log warning
            _logger.warning("Twilio inbound SMS: no partner found for number %s", from_number)

        # Twilio requires a TwiML response (empty = no auto-reply)
        return self._twiml_response()

    def _get_number_variants(self, number):
        """Return all plausible formats for a given number to match against Odoo."""
        clean = re.sub(r'[\s\-\(\)]', '', number)
        variants = {clean}

        # +447... -> 07...  (UK local format stored in Odoo)
        if clean.startswith('+44'):
            variants.add('0' + clean[3:])
            variants.add('0044' + clean[3:])

        # 0044... -> +44... and 07...
        if clean.startswith('0044'):
            variants.add('+' + clean[2:])
            variants.add('0' + clean[4:])

        # 07... -> +447...
        if clean.startswith('07') and len(clean) == 11:
            variants.add('+44' + clean[1:])

        return variants

    def _find_partner(self, original, _normalized=None):
        """Search partner by phone or mobile, trying all number format variants."""
        Partner = request.env['res.partner'].sudo()
        variants = self._get_number_variants(original)

        for number in variants:
            partner = Partner.search([
                '|',
                ('mobile', '=', number),
                ('phone', '=', number),
            ], limit=1)
            if partner:
                return partner

        return None

    def _twiml_response(self, message=None):
        """Return an empty TwiML response (no auto-reply) or with a message."""
        if message:
            body = f"<?xml version='1.0' encoding='UTF-8'?><Response><Message>{message}</Message></Response>"
        else:
            body = "<?xml version='1.0' encoding='UTF-8'?><Response></Response>"
        return request.make_response(
            body,
            headers=[('Content-Type', 'text/xml')]
        )
