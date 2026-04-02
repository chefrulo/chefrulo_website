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

        # Normalize number variants: +44... / 0044... / 44...
        normalized = self._normalize_number(from_number)

        # Search partner by mobile or phone, trying both original and normalized
        partner = self._find_partner(from_number, normalized)

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

    def _normalize_number(self, number):
        """Convert number to E.164 format best-effort for matching."""
        # Remove spaces and dashes
        clean = re.sub(r'[\s\-\(\)]', '', number)
        # 0044... -> +44...
        if clean.startswith('0044'):
            clean = '+' + clean[2:]
        # 44... (without +) -> +44...
        elif re.match(r'^44\d{10}$', clean):
            clean = '+' + clean
        return clean

    def _find_partner(self, original, normalized):
        """Search partner by mobile or phone, trying multiple number formats."""
        Partner = request.env['res.partner'].sudo()
        numbers = list({original, normalized})  # deduplicate

        for number in numbers:
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
