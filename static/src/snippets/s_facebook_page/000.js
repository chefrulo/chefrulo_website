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

        // Use section width for full-width embed
        const width = this.el.offsetWidth || containerEl.parentElement?.offsetWidth || 800;

        const encodedUrl = encodeURIComponent(`https://www.facebook.com/${page}`);
        const iframeEl = document.createElement("iframe");
        iframeEl.src = [
            `https://www.facebook.com/plugins/page.php`,
            `?href=${encodedUrl}`,
            `&tabs=timeline`,
            `&width=${width}`,
            `&height=${height}`,
            `&small_header=false`,
            `&adapt_container_width=true`,
            `&hide_cover=false`,
            `&show_facepile=false`,
        ].join("");
        iframeEl.style.border = "none";
        iframeEl.style.overflow = "hidden";
        iframeEl.style.display = "block";
        iframeEl.setAttribute("scrolling", "no");
        iframeEl.setAttribute("allowFullScreen", "true");
        iframeEl.setAttribute("allow", "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share");
        iframeEl.width = width;
        iframeEl.height = height;
        iframeEl.classList.add("w-100");

        containerEl.appendChild(iframeEl);

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
