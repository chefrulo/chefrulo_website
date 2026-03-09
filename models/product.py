import json
from markupsafe import Markup
from odoo import models


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    def get_schema_org_json(self):
        """Return schema.org Product JSON-LD as Markup (safe for t-out in QWeb)."""
        self.ensure_one()
        website = self.env['website'].get_current_website()
        base_url = (website.domain or 'https://chefrulo.com').rstrip('/')

        schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": self.name,
            "image": f"{base_url}/web/image/product.template/{self.id}/image_1920",
            "brand": {
                "@type": "Brand",
                "name": "Chef Rulo",
            },
            "offers": {
                "@type": "Offer",
                "url": f"{base_url}{self.website_url}",
                "priceCurrency": website.currency_id.name,
                "price": self.list_price,
                "availability": "https://schema.org/InStock",
                "seller": {
                    "@type": "Organization",
                    "name": "Chef Rulo Limited",
                },
            },
        }
        return Markup(json.dumps(schema, ensure_ascii=False))
