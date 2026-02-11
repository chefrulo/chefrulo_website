{
    "name": "Chefrulo Website - Request Quote",
    "version": "17.0.1.0.0",
    "summary": "Chefrulo website customizations",
    "description": """
        Chefrulo Website Customizations
        ================================
        - Request Quote button on cart and payment pages (per website toggle)
        - Menu/catalog page at /menu with categories and add-to-cart
        - Custom SCSS styles
    """,
    "category": "Website",
    "author": "Chefrulo",
    "license": "LGPL-3",
    "depends": ["website_sale", "chefrulo_recipe"],
    "data": [
        "views/templates.xml",
        "views/snippets_products_block.xml",
        "views/res_config_settings_views.xml",
        "views/product_views.xml",
        "views/recipe_views.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "chefrulo_website/static/src/scss/style.scss",
            "chefrulo_website/static/src/js/menu_add_to_cart.js",
            "chefrulo_website/static/src/js/products_block_variants.js",
            "chefrulo_website/static/src/js/frozen_image_modal.js",
            "chefrulo_website/static/src/js/dynamic_products_snippet.js",
            "chefrulo_website/static/src/js/product_page_discount.js",
            "chefrulo_website/static/src/js/catering_quote_mode.js",
        ],
    },
    "installable": True,
    "auto_install": False,
}
