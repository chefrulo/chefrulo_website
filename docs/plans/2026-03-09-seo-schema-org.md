# SEO & Schema.org Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add schema.org JSON-LD structured data and meta tags to the chefrulo_website Odoo addon to improve visibility in Google Search and AI-driven search results.

**Architecture:** Three separate XPath template overrides in `templates.xml`: (1) a global `LocalBusiness` JSON-LD injected in `website.layout`, (2) a `Product` JSON-LD injected in `website_sale.product`, and (3) a `Recipe` JSON-LD injected in the existing `recipe_detail` template. No new files needed — all changes go in `views/templates.xml`.

**Tech Stack:** Odoo 17 QWeb templates, schema.org JSON-LD (application/ld+json script tags), XPath `position="inside"` on `<head>`.

---

## Business Data Reference

```
Name:        Chef Rulo Limited
Main addr:   523 Bromley Road, Bromley, BR1 4PG, London, UK
Phone:       +447832300695
Email:       info@chefrulo.com
URL:         https://chefrulo.com
Cuisine:     Modern Argentine, Empanadas, Sandwiches
Rating:      5.0 / 14 reviews (Google)

Stall addr:  7 Austin Friars, Bank, London, EC2N 2HA
Stall hours: Tuesday–Friday 08:00–15:00
```

---

### Task 1: Global LocalBusiness JSON-LD

**Files:**
- Modify: `views/templates.xml` — add after the existing `favicon_head` template (around line 13)

**Step 1: Add the template to `views/templates.xml`**

Insert this block right after the closing `</template>` of `favicon_head` (after line 13):

```xml
    <!-- Schema.org LocalBusiness JSON-LD -->
    <template id="schema_local_business" inherit_id="website.layout" name="Chef Rulo LocalBusiness Schema">
        <xpath expr="//head" position="inside">
            <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  "name": "Chef Rulo Limited",
  "description": "Homemade Argentinian empanadas and modern Argentine food in London. Fire, Ritual, Soul.",
  "url": "https://chefrulo.com",
  "telephone": "+447832300695",
  "email": "info@chefrulo.com",
  "servesCuisine": ["Modern Argentine", "Empanadas", "Sandwiches"],
  "priceRange": "££",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "523 Bromley Road",
    "addressLocality": "Bromley",
    "postalCode": "BR1 4PG",
    "addressRegion": "London",
    "addressCountry": "GB"
  },
  "location": [
    {
      "@type": "FoodEstablishment",
      "name": "Chef Rulo — Bank Market Stall",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "7 Austin Friars",
        "addressLocality": "Bank, London",
        "postalCode": "EC2N 2HA",
        "addressCountry": "GB"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "08:00",
          "closes": "15:00"
        }
      ]
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "14",
    "bestRating": "5"
  },
  "sameAs": [
    "https://www.google.com/maps/place/Chef+Rulo+Homemade+Argentinean+Empanadas/@51.4226636,-0.0024319,17z"
  ]
}
            </script>
        </xpath>
    </template>
```

**Step 2: Verify in Odoo**

- Upgrade the module: `Settings > Technical > Modules > chefrulo_website > Upgrade`
- Open any page on the site (e.g. `/`)
- View page source (`Ctrl+U`) and search for `FoodEstablishment`
- Expected: the JSON-LD block appears in `<head>`

**Step 3: Validate**

- Paste any page URL at https://validator.schema.org or use Google's Rich Results Test
- Expected: `FoodEstablishment` entity recognized, no errors

**Step 4: Commit**

```bash
git add views/templates.xml
git commit -m "feat: add LocalBusiness schema.org JSON-LD to all pages"
```

---

### Task 2: Product JSON-LD on product pages

**Files:**
- Modify: `views/templates.xml` — add after Task 1's template

**Step 1: Add the template**

This overrides `website_sale.product` to inject a `Product` JSON-LD. The QWeb `t-esc` / `t-att` attributes are NOT available inside `<script>` tags — use a `t-set` + string approach with `t-out` rendered via a separate `<div style="display:none">` trick.

The correct Odoo pattern is to use a `<t>` block to build the JSON and then output it in the script:

```xml
    <!-- Schema.org Product JSON-LD -->
    <template id="schema_product" inherit_id="website_sale.product" name="Chef Rulo Product Schema">
        <xpath expr="//head" position="inside">
            <t t-set="product_url" t-value="'https://chefrulo.com/shop/' + str(product.id)"/>
            <t t-set="product_image_url" t-value="'https://chefrulo.com/web/image/product.template/' + str(product.id) + '/image_1920'"/>
            <script type="application/ld+json" t-att-data-product-id="product.id">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "<t t-out="product.name"/>",
  "description": "<t t-out="(product.description_sale or '').replace('&amp;', 'and').replace('&lt;', '').replace('&gt;', '').replace('&quot;', '').replace('&#39;', '')"/>",
  "image": "<t t-out="product_image_url"/>",
  "brand": {
    "@type": "Brand",
    "name": "Chef Rulo"
  },
  "offers": {
    "@type": "Offer",
    "url": "<t t-out="product_url"/>",
    "priceCurrency": "<t t-out="website.currency_id.name"/>",
    "price": "<t t-out="'%.2f' % product.list_price"/>",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Chef Rulo Limited"
    }
  }
}
            </script>
        </xpath>
    </template>
```

> **Note:** Odoo 17 QWeb renders `t-out` inside `<script type="application/ld+json">` correctly as plain text (not escaped HTML). Test to confirm before shipping.

**Step 2: Verify**

- Upgrade module
- Open any product page e.g. `/shop/42`
- View source, search `"@type": "Product"`
- Expected: product name, price (GBP), and image URL in the JSON

**Step 3: Validate**

- Paste the product page URL in Google Rich Results Test
- Expected: `Product` with `Offer` recognized

**Step 4: Commit**

```bash
git add views/templates.xml
git commit -m "feat: add Product schema.org JSON-LD to product pages"
```

---

### Task 3: Recipe JSON-LD on recipe detail pages

**Files:**
- Modify: `views/templates.xml` — add to the existing `recipe_detail` template (around line 481)

**Step 1: Add schema inside the `recipe_detail` template**

The `recipe_detail` template uses `t-call="website.layout"`. To inject into `<head>`, we use the `head` block that `website.layout` provides via `t-call-assets`. The correct pattern in Odoo is to add a `<t t-call-assets>` or use a separate `inherit_id` override.

Simplest approach: add an `inherit_id="chefrulo_website.recipe_detail"` template that appends JSON-LD before `</div>` in `#wrap`, using a `<script>` inside the body (valid per schema.org spec — JSON-LD can be anywhere in the page):

```xml
    <!-- Schema.org Recipe JSON-LD -->
    <template id="schema_recipe" inherit_id="chefrulo_website.recipe_detail" name="Chef Rulo Recipe Schema">
        <xpath expr="//div[@id='wrap']" position="inside">
            <t t-set="recipe_url" t-value="'https://chefrulo.com/recipes/' + str(recipe.id)"/>
            <t t-set="recipe_image_url" t-value="'https://chefrulo.com/recipes/image/' + str(recipe.id)"/>
            <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "<t t-out="recipe.name"/>",
  "description": "<t t-out="recipe.description or ''"/>",
  "image": "<t t-out="recipe_image_url"/>",
  "author": {
    "@type": "Person",
    "name": "Chef Rulo"
  },
  "recipeYield": "<t t-out="str(recipe.portions)"/> portions",
  "recipeCategory": "<t t-out="recipe.category_id.name if recipe.category_id else 'Argentine'"/>",
  "recipeCuisine": "Argentine",
  "recipeIngredient": [<t t-foreach="recipe.line_ids" t-as="line"><t t-if="not line_first">, </t>"<t t-out="(str(line.quantity) + ' ' + (line.uom_id.name or '') + ' ' + (line.ingredient_id.name or line.sub_recipe_id.name or '')).strip()"/>"</t>],
  "url": "<t t-out="recipe_url"/>"
}
            </script>
        </xpath>
    </template>
```

**Step 2: Verify**

- Upgrade module
- Open a recipe page with ingredients e.g. `/recipes/1`
- View source, search `"@type": "Recipe"`
- Expected: recipe name, ingredient list, author "Chef Rulo"

**Step 3: Validate**

- Paste recipe URL at https://validator.schema.org
- Expected: `Recipe` entity recognized with `recipeIngredient` array

**Step 4: Commit**

```bash
git add views/templates.xml
git commit -m "feat: add Recipe schema.org JSON-LD to recipe detail pages"
```

---

### Task 4: Meta description tags for custom pages

Odoo's `website.layout` already handles `<title>` via `website.page_title`. For custom pages (`/catering`, `/recipes`, `/recipes/<id>`) we can add `<meta name="description">` dynamically.

**Files:**
- Modify: `views/templates.xml` — add head injections in the `menu_page` and recipe templates
- Modify: `controllers/main.py` — pass `meta_description` to template context

**Step 1: Add `meta_description` to catering controller context**

In `controllers/main.py`, in `_render_menu_page`:

```python
values = {
    'menu_data': menu_data,
    'is_catering': category_filter == 'Catering',
    'meta_description': (
        'Order authentic Argentine catering in London. Empanadas, sandwiches and more from Chef Rulo. '
        'Perfect for events, offices and private parties.'
        if category_filter == 'Catering'
        else 'Browse the Chef Rulo menu — handmade Argentine empanadas and more, available for delivery and collection.'
    ),
}
```

**Step 2: Add meta description to menu_page template**

In the `menu_page` template (`templates.xml` around line 126), add a head override. Since `menu_page` uses `t-call="website.layout"`, inject via the `head` slot:

```xml
    <!-- Meta description for catering/menu pages -->
    <template id="menu_page_meta" inherit_id="chefrulo_website.menu_page" name="Menu Page Meta">
        <xpath expr="//t[@t-call='website.layout']" position="inside">
            <t t-set="head">
                <meta t-if="meta_description" name="description" t-att-content="meta_description"/>
            </t>
        </xpath>
    </template>
```

> **Note:** The `head` t-set variable is consumed by `website.layout` as extra head content. Verify this works in Odoo 17 — if not, use an `xpath` on the head directly via a separate inherit.

**Step 3: Add meta description to recipe_detail template**

Similarly for recipe pages, add dynamic description based on `recipe.description`:

```xml
    <!-- Meta description for recipe detail pages -->
    <template id="recipe_detail_meta" inherit_id="chefrulo_website.recipe_detail" name="Recipe Detail Meta">
        <xpath expr="//t[@t-call='website.layout']" position="inside">
            <t t-set="head">
                <t t-set="meta_desc" t-value="(recipe.description or '')[:155]"/>
                <meta name="description" t-att-content="meta_desc or recipe.name + ' — recipe by Chef Rulo'"/>
            </t>
        </xpath>
    </template>
```

**Step 4: Verify**

- Open `/catering` in browser, view source
- Expected: `<meta name="description" content="Order authentic Argentine catering..."/>`
- Open a recipe page, check meta description reflects recipe.description

**Step 5: Commit**

```bash
git add views/templates.xml controllers/main.py
git commit -m "feat: add meta description tags to catering and recipe pages"
```

---

## Testing Checklist

After all tasks:

- [ ] https://chefrulo.com/ — view source — `FoodEstablishment` JSON-LD present
- [ ] https://chefrulo.com/shop/<id> — `Product` JSON-LD present with correct price (GBP)
- [ ] https://chefrulo.com/recipes/<id> — `Recipe` JSON-LD present with ingredients
- [ ] https://chefrulo.com/catering — `<meta name="description">` present
- [ ] Run Google Rich Results Test on each page type
- [ ] Run https://validator.schema.org on each page type
- [ ] No Odoo upgrade errors in server logs

## Rollback

All changes are in `views/templates.xml` and `controllers/main.py`. To rollback, revert the git commits and upgrade the module.
