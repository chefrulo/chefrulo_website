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
        const pageUrl = this.el.dataset.facebookPage || "";
        const appId = this.el.dataset.facebookAppId || "";
        const width = containerEl.offsetWidth || 500;

        // Load the Facebook SDK if not already loaded
        if (!document.getElementById("facebook-jssdk")) {
            const script = document.createElement("script");
            script.id = "facebook-jssdk";
            script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0&appId=${appId}`;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        } else if (window.FB) {
            window.FB.XFBML.parse(containerEl);
        }

        // Build the Page Plugin iframe URL directly (works without SDK too)
        const encodedUrl = encodeURIComponent(`https://www.facebook.com/${pageUrl}`);
        const iframeEl = document.createElement("iframe");
        iframeEl.src = `https://www.facebook.com/plugins/page.php?href=${encodedUrl}&tabs=timeline&width=${width}&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId=${appId}`;
        iframeEl.style.border = "none";
        iframeEl.style.overflow = "hidden";
        iframeEl.setAttribute("scrolling", "no");
        iframeEl.setAttribute("allowFullScreen", "true");
        iframeEl.setAttribute("allow", "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share");
        iframeEl.width = width;
        iframeEl.height = 500;
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
