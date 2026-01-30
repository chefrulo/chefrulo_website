{
    "name": "Chefrulo Website - Request Quote",
    "version": "17.0.1.0.0",
    "summary": "Add Request Quote option to website shop cart",
    "description": """
        Chefrulo Website Customizations
        ================================
        - Adds a 'Request Quote' button on the shopping cart page
        - Customers can request a quotation without going through payment
        - Creates a draft sale order and notifies the sales team
        - Normal checkout with payment remains available
    """,
    "category": "Website",
    "author": "Chefrulo",
    "license": "LGPL-3",
    "depends": ["website_sale"],
    "data": [
        "views/templates.xml",
        "views/res_config_settings_views.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "chefrulo_website/static/src/scss/style.scss",
        ],
    },
    "installable": True,
    "auto_install": False,
}
