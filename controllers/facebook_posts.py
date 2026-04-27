import json
import requests
from odoo import http
from odoo.http import request


class FacebookPostsController(http.Controller):

    @http.route('/facebook/page-posts', type='http', auth='public', methods=['GET'])
    def get_page_posts(self, page='chefrulo.uk', limit='6', **kwargs):
        page_token = request.env['ir.config_parameter'].sudo().get_param(
            'chefrulo.facebook_page_token', ''
        ).strip()

        if not page_token:
            return request.make_response(
                json.dumps({'error': 'No Facebook page token configured'}),
                headers=[('Content-Type', 'application/json')],
            )

        try:
            url = 'https://graph.facebook.com/v19.0/me/published_posts'
            params = {
                'fields': 'message,full_picture,permalink_url,created_time',
                'limit': max(1, min(int(limit), 12)),
                'access_token': page_token,
            }
            resp = requests.get(url, params=params, timeout=10)
            data = resp.json()
            if 'error' in data:
                return request.make_response(
                    json.dumps({'error': data['error']}),
                    headers=[('Content-Type', 'application/json')],
                )
            resp.raise_for_status()

            posts = [
                {
                    'image': p.get('full_picture', ''),
                    'url': p.get('permalink_url', ''),
                    'message': (p.get('message') or '')[:120],
                }
                for p in data.get('data', [])
                if p.get('full_picture')   # only posts that have an image
            ]

            return request.make_response(
                json.dumps({'posts': posts[:int(limit)]}),
                headers=[('Content-Type', 'application/json')],
            )
        except Exception as e:
            return request.make_response(
                json.dumps({'error': str(e)}),
                headers=[('Content-Type', 'application/json')],
            )
