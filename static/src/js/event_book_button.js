/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

// Finds any link pointing to #modal_ticket_registration and wires up
// the Bootstrap 5 modal trigger attributes so the website builder button works.
publicWidget.registry.EventBookButton = publicWidget.Widget.extend({
    selector: ".o_wevent_event_main_col, #wrapwrap",
    start() {
        this._wireBookButtons();
        return this._super(...arguments);
    },
    _wireBookButtons() {
        this.el.querySelectorAll('a[href="#modal_ticket_registration"]').forEach((el) => {
            el.setAttribute("data-bs-toggle", "modal");
            el.setAttribute("data-bs-target", "#modal_ticket_registration");
        });
    },
});
