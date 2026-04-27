/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

const FacebookPage = publicWidget.Widget.extend({
    selector: ".s_facebook_page",
    disabledInEditableMode: false,

    /**
     * @override
     */
    start() {
        const containerEl = this.el.querySelector(".o_facebook_container");
        const page = this.el.dataset.facebookPage || "chefrulo.uk";
        const height = parseInt(this.el.dataset.height || "700", 10);
        const tabs = this.el.dataset.tabs || "photos";

        // Ensure fb-root exists (required by the SDK)
        if (!document.getElementById("fb-root")) {
            const fbRoot = document.createElement("div");
            fbRoot.id = "fb-root";
            document.body.prepend(fbRoot);
        }

        // Build the XFBML div — the SDK measures the container for true full-width
        const fbPageEl = document.createElement("div");
        fbPageEl.className = "fb-page";
        fbPageEl.dataset.href = `https://www.facebook.com/${page}`;
        fbPageEl.dataset.tabs = tabs;
        fbPageEl.dataset.width = "";           // empty = SDK measures container
        fbPageEl.dataset.height = height;
        fbPageEl.dataset.smallHeader = "false";
        fbPageEl.dataset.adaptContainerWidth = "true";
        fbPageEl.dataset.hideCover = "false";
        fbPageEl.dataset.showFacepile = "false";
        containerEl.appendChild(fbPageEl);

        // Load SDK or re-parse if already loaded
        if (!document.getElementById("facebook-jssdk")) {
            const script = document.createElement("script");
            script.id = "facebook-jssdk";
            script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0&appId=2581581135576762";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        } else if (window.FB) {
            window.FB.XFBML.parse(containerEl);
        }

        return this._super(...arguments);
    },

    /**
     * @override
     */
    destroy() {
        const containerEl = this.el.querySelector(".o_facebook_container");
        if (containerEl) {
            containerEl.innerHTML = "";
        }
        this._super.apply(this, arguments);
    },
});

publicWidget.registry.FacebookPage = FacebookPage;

export default FacebookPage;
