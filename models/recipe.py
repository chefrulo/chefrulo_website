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
