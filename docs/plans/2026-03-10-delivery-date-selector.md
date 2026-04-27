# Delivery Date Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a required delivery date selector and optional shipping comments to the Odoo checkout payment page for frozen product orders.

**Architecture:** Four-layer implementation: (1) two new fields on `sale.order` plus a helper method to compute next 5 working days, (2) a JSON endpoint to persist the data, (3) a QWeb template override injecting the UI inside the existing `#delivery_carrier` div, and (4) a small vanilla-JS file handling carrier-type info text, AJAX saves, and pay-button validation.

**Tech Stack:** Odoo 17, QWeb templates, Python datetime, vanilla JS (no framework), Odoo JSON-RPC.

---

## Context

- The checkout payment page is rendered by `website_sale.payment`
- The delivery carrier section is injected by `website_sale.payment_delivery` (in `/opt/odoo17/odoo/addons/website_sale/views/website_sale_delivery_templates.xml`)
  — it adds `<div t-if="deliveries" id="delivery_carrier">` before the payment methods
- Three carriers already exist in Odoo: "Standard delivery" (£5/free at £60), "Bank Shop take away" (free), "Bromley Road Take Away" (free)
- `website_sale_order` (the current `sale.order`) is available in the payment page template context
- `has_catering_products` on `sale.order` is already used to redirect catering to quote flow — frozen orders go through normal payment

## Carrier type detection (for JS info text)

In JS, detect carrier type from the carrier label text:
- Label contains "take away" (case-insensitive) → `pickup`
- Otherwise → `delivery`

Info text per type:
- **delivery**: "Delivery by 6pm — Within 4 miles of our kitchen (£5.00, free over £60)"
- **pickup**: "Pickup from 5pm–9pm — 523 Bromley Road, Bromley BR1 4PG"

---

## Business Rules

- Available dates: next 5 Monday–Friday working days from today (skip Saturday/Sunday)
- Start from tomorrow (not today, to give preparation time)
- `delivery_date` is **required** — payment blocked if not selected
- `shipping_note` is optional
- The date and note are saved to `sale.order` via AJAX when changed (not on payment submit)
- When page reloads (e.g. after carrier change), the previously saved date is pre-selected

---

### Task 1: Add fields and date helper to `sale.order`

**Files:**
- Modify: `models/sale_order.py`

**Step 1: Add fields and method**

Add to the existing `SaleOrder` class in `models/sale_order.py`, after the `has_catering_products` computed field:

```python
    delivery_date = fields.Char(
        string='Delivery/Pickup Date',
        help='Date chosen by the customer during checkout'
    )
    shipping_note = fields.Text(
        string='Shipping Notes',
        help='Special instructions from the customer'
    )

    def get_available_delivery_dates(self):
        """Return list of next 5 Mon–Fri working day labels from tomorrow."""
        from datetime import date, timedelta
        today = date.today()
        dates = []
        d = today + timedelta(days=1)
        while len(dates) < 5:
            if d.weekday() < 5:  # 0=Mon … 4=Fri
                dates.append(d.strftime('%A %-d %B'))
            d += timedelta(days=1)
        return dates
```

**Step 2: Verify Python syntax**

```bash
python3 -c "import ast; ast.parse(open('models/sale_order.py').read()); print('OK')"
```
Expected: `OK`

**Step 3: Commit**

```bash
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website add models/sale_order.py
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website commit -m "feat: add delivery_date and shipping_note fields to sale.order"
```

---

### Task 2: Add JSON endpoint to save delivery info

**Files:**
- Modify: `controllers/main.py`

**Step 1: Add the route**

Add a new controller class at the END of `controllers/main.py`, before the final newline:

```python

class WebsiteDeliveryInfo(http.Controller):

    @http.route('/shop/save_delivery_info', type='json', auth='public', website=True)
    def save_delivery_info(self, delivery_date=None, shipping_note=None, **kwargs):
        """Save delivery date and shipping note to the current order."""
        order = request.website.sale_get_order()
        if not order:
            return {'error': 'No active order'}
        vals = {}
        if delivery_date is not None:
            vals['delivery_date'] = delivery_date
        if shipping_note is not None:
            vals['shipping_note'] = shipping_note
        if vals:
            order.sudo().write(vals)
        return {'success': True}
```

**Step 2: Verify syntax**

```bash
python3 -c "import ast; ast.parse(open('controllers/main.py').read()); print('OK')"
```
Expected: `OK`

**Step 3: Commit**

```bash
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website add controllers/main.py
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website commit -m "feat: add /shop/save_delivery_info JSON endpoint"
```

---

### Task 3: Inject date selector into checkout payment template

**Files:**
- Modify: `views/templates.xml`

**Step 1: Add the template override**

Append the following template before the closing `</odoo>` tag in `views/templates.xml`:

```xml
    <!-- ========================================
         Delivery Date Selector on Payment Page
         ======================================== -->
    <template id="delivery_date_selector" inherit_id="website_sale.payment_delivery" name="Delivery Date &amp; Comments">
        <xpath expr="//div[@id='delivery_carrier']" position="inside">
            <div id="delivery_date_block" class="mt-4">
                <h4 class="fs-6 small text-uppercase fw-bolder">Choose your date</h4>
                <div class="card border-0">
                    <div class="card-body p-0">
                        <select id="delivery_date_select"
                                class="form-select mb-2">
                            <option value="">— Select a date —</option>
                            <t t-foreach="website_sale_order.get_available_delivery_dates()" t-as="d">
                                <option t-att-value="d"
                                        t-att-selected="website_sale_order.delivery_date == d">
                                    <t t-out="d"/>
                                </option>
                            </t>
                        </select>

                        <div id="delivery_info_delivery" class="text-muted small mb-3 d-none">
                            <i class="fa fa-info-circle me-1"></i>
                            Delivery by 6pm — Within 4 miles of our kitchen (£5.00, free over £60)
                        </div>
                        <div id="delivery_info_pickup" class="text-muted small mb-3 d-none">
                            <i class="fa fa-info-circle me-1"></i>
                            Pickup from 5pm–9pm — 523 Bromley Road, Bromley BR1 4PG
                        </div>
                        <div id="delivery_date_error" class="text-danger small mb-2 d-none">
                            Please select a delivery/pickup date before paying.
                        </div>

                        <label class="fs-6 small text-uppercase fw-bolder d-block mt-3 mb-2"
                               for="shipping_note_input">
                            Comments / Special instructions
                        </label>
                        <textarea id="shipping_note_input"
                                  class="form-control"
                                  rows="3"
                                  placeholder="Allergies, special requests, delivery instructions..."><t t-out="website_sale_order.shipping_note or ''"/></textarea>
                    </div>
                </div>
            </div>
        </xpath>
    </template>
```

**Step 2: Validate XML**

```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('views/templates.xml'); print('OK')"
```
Run from `/home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website`.
Expected: `OK`

**Step 3: Commit**

```bash
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website add views/templates.xml
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website commit -m "feat: add delivery date selector and comments to checkout payment page"
```

---

### Task 4: JS — carrier info text, AJAX save, pay-button validation

**Files:**
- Create: `static/src/js/delivery_date_selector.js`
- Modify: `__manifest__.py`

**Step 1: Create the JS file**

Create `/home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website/static/src/js/delivery_date_selector.js`:

```javascript
/**
 * Delivery Date Selector
 * - Updates info text when carrier radio changes
 * - Saves delivery_date and shipping_note via AJAX on change
 * - Validates date is selected before allowing payment
 */
(function () {
    'use strict';

    function isPickup(radioEl) {
        const label = document.querySelector('label[for="' + radioEl.id + '"]');
        const name = label ? label.textContent.toLowerCase() : '';
        return name.includes('take away') || name.includes('pickup') || name.includes('pick up');
    }

    function updateInfoText(isPickupType) {
        const deliveryInfo = document.getElementById('delivery_info_delivery');
        const pickupInfo = document.getElementById('delivery_info_pickup');
        if (!deliveryInfo || !pickupInfo) return;
        if (isPickupType) {
            deliveryInfo.classList.add('d-none');
            pickupInfo.classList.remove('d-none');
        } else {
            pickupInfo.classList.add('d-none');
            deliveryInfo.classList.remove('d-none');
        }
    }

    function saveDeliveryInfo(data) {
        return fetch('/shop/save_delivery_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: data,
            }),
        });
    }

    function init() {
        const dateBlock = document.getElementById('delivery_date_block');
        if (!dateBlock) return;  // not on payment page

        const dateSelect = document.getElementById('delivery_date_select');
        const noteTextarea = document.getElementById('shipping_note_input');
        const errorDiv = document.getElementById('delivery_date_error');
        const carrierRadios = document.querySelectorAll('input[name="delivery_type"]');

        // Set initial info text from pre-selected carrier
        const checkedRadio = document.querySelector('input[name="delivery_type"]:checked');
        if (checkedRadio) {
            updateInfoText(isPickup(checkedRadio));
        }

        // Carrier change: update info text
        carrierRadios.forEach(function (radio) {
            radio.addEventListener('change', function () {
                updateInfoText(isPickup(this));
            });
        });

        // Date select change: save to order
        if (dateSelect) {
            dateSelect.addEventListener('change', function () {
                const val = this.value;
                if (val) {
                    errorDiv && errorDiv.classList.add('d-none');
                    saveDeliveryInfo({ delivery_date: val });
                }
            });
        }

        // Shipping note blur: save to order
        if (noteTextarea) {
            noteTextarea.addEventListener('blur', function () {
                saveDeliveryInfo({ shipping_note: this.value });
            });
        }

        // Pay button: validate date is selected
        function validateAndBlock(e) {
            if (!dateSelect || dateSelect.value) return;  // OK
            e.preventDefault();
            e.stopImmediatePropagation();
            if (errorDiv) errorDiv.classList.remove('d-none');
            dateSelect.focus();
            dateSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Intercept Odoo payment submit button (class used in Odoo 17 website_sale)
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('.o_payment_submit_button, [name="o_payment_submit_button"], button.btn-primary[type="submit"]');
            if (btn && dateBlock) {
                validateAndBlock(e);
            }
        }, true);  // capture phase to fire before Odoo's listener
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
```

**Step 2: Add JS to manifest**

In `__manifest__.py`, add the new JS file to `web.assets_frontend` list (after `shipping_address_filter.js`):

```python
"chefrulo_website/static/src/js/delivery_date_selector.js",
```

**Step 3: Verify manifest syntax**

```bash
python3 -c "import ast; ast.parse(open('__manifest__.py').read()); print('OK')"
```
Expected: `OK`

**Step 4: Commit**

```bash
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website add static/src/js/delivery_date_selector.js __manifest__.py
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website commit -m "feat: add JS for delivery date carrier info, AJAX save, and pay-button validation"
```

---

### Task 5: Show delivery_date and shipping_note in the backend sale order form

**Files:**
- Create: `views/sale_order_views.xml`
- Modify: `__manifest__.py`

**Step 1: Create backend view**

Create `/home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website/views/sale_order_views.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<odoo>

    <!-- Show delivery date and shipping note on sale order form -->
    <record id="sale_order_delivery_info_view" model="ir.ui.view">
        <field name="name">sale.order.delivery.info</field>
        <field name="model">sale.order</field>
        <field name="inherit_id" ref="sale.view_order_form"/>
        <field name="arch" type="xml">
            <xpath expr="//field[@name='note']" position="before">
                <group string="Delivery Info" col="2"
                       attrs="{'invisible': [('delivery_date', '=', False), ('shipping_note', '=', False)]}">
                    <field name="delivery_date" readonly="1"/>
                    <field name="shipping_note" readonly="1"/>
                </group>
            </xpath>
        </field>
    </record>

</odoo>
```

**Step 2: Register in manifest**

In `__manifest__.py`, add to the `data` list (after `views/recipe_views.xml`):

```python
"views/sale_order_views.xml",
```

Also add `"sale"` to `depends` if not already present (check — `website_sale` already depends on `sale` so it's inherited, but to be explicit when referencing `sale.view_order_form` we may need it).

Actually `website_sale` depends on `sale`, so `sale.view_order_form` will be available. No need to add `sale` explicitly to depends.

**Step 3: Validate XML**

```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('views/sale_order_views.xml'); print('OK')"
```
Expected: `OK`

**Step 4: Commit**

```bash
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website add views/sale_order_views.xml __manifest__.py
git -C /home/eduardo/dev/odoo/chefrulo_addons/chefrulo_website commit -m "feat: show delivery_date and shipping_note on sale order backend form"
```

---

## Testing Checklist

After all tasks and module upgrade:

- [ ] Go to `/frozen` → add product to cart → checkout → payment page
- [ ] The "Choose your date" block appears below carrier selection
- [ ] Selecting "Standard delivery" shows delivery info text (by 6pm, £5)
- [ ] Selecting "Bromley Road Take Away" shows pickup info text (5pm–9pm)
- [ ] Date select has 5 Mon–Fri dates starting from tomorrow
- [ ] Clicking "Pay now" WITHOUT selecting a date → error message appears, scroll to select
- [ ] Selecting a date → AJAX call to `/shop/save_delivery_info` → 200 response
- [ ] Entering shipping note and clicking away → AJAX saves it
- [ ] Reload page → previously selected date is pre-selected in the dropdown
- [ ] In Odoo backend: open a sale order → "Delivery Info" group shows date and note

## Rollback

Revert all commits and upgrade the module. The fields `delivery_date` and `shipping_note` will remain as columns in the DB but cause no harm if empty.
