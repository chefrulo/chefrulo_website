import json

from markupsafe import Markup

from odoo import fields, models


class RecipeRecipe(models.Model):
    _inherit = 'recipe.recipe'

    is_published = fields.Boolean(
        string='Show on Website',
        default=False,
        help='If checked, this recipe will be visible on the /recipes page'
    )
    website_description = fields.Html(
        string='Website Description',
        help='Optional description for the website (if different from internal description)'
    )

    def get_schema_org_json(self):
        """Return schema.org Recipe JSON-LD as Markup (safe for t-out in QWeb)."""
        self.ensure_one()
        website = self.env['website'].get_current_website()
        base_url = (website.domain or 'https://chefrulo.com').rstrip('/')

        ingredients = []
        for line in self.line_ids:
            name = (line.ingredient_id.name if line.ingredient_id else None) or \
                   (line.sub_recipe_id.name if line.sub_recipe_id else None) or ''
            if name:
                qty = str(line.quantity).rstrip('0').rstrip('.') if '.' in str(line.quantity) else str(int(line.quantity))
                uom = line.uom_id.name if line.uom_id else ''
                ingredients.append(' '.join(filter(None, [qty, uom, name])))

        schema = {
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": self.name,
            "image": f"{base_url}/recipes/image/{self.id}",
            "author": {
                "@type": "Person",
                "name": "Chef Rulo",
            },
            "recipeYield": f"{self.portions} portions",
            "recipeCategory": self.category_id.name if self.category_id else "Argentine",
            "recipeCuisine": "Argentine",
            "url": f"{base_url}/recipes/{self.id}",
        }
        if self.description:
            schema["description"] = self.description
        if ingredients:
            schema["recipeIngredient"] = ingredients

        return Markup(json.dumps(schema, ensure_ascii=False))
