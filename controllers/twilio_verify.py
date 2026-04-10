from odoo import http
from odoo.http import request


class TwilioDomainVerify(http.Controller):

    @http.route('/75fffc5752bebf0a3729c3bb899ebf41.html', type='http', auth='public', methods=['GET'], csrf=False)
    def twilio_verify(self, **kwargs):
        return request.make_response(
            'twilio-domain-verification=75fffc5752bebf0a3729c3bb899ebf41',
            headers=[('Content-Type', 'text/html')]
        )
