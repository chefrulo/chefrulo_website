/** @odoo-module **/

// Any link/button pointing to #modal_ticket_registration opens the
// registration modal automatically, without needing data-bs-toggle="modal".
document.addEventListener("click", function (ev) {
    const el = ev.target.closest('a[href="#modal_ticket_registration"], button[data-target="#modal_ticket_registration"]');
    if (!el) return;
    ev.preventDefault();
    const modalEl = document.getElementById("modal_ticket_registration");
    if (modalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
});
