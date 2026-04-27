/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

const FacebookPage = publicWidget.Widget.extend({
    selector: ".s_facebook_page",
    disabledInEditableMode: false,

    /**
     * @override
     */
    async start() {
        const containerEl = this.el.querySelector(".o_facebook_container");
        const page = this.el.dataset.facebookPage || "chefrulo.uk";
        const limit = parseInt(this.el.dataset.limit || "6", 10);

        containerEl.innerHTML = this._loadingHTML();

        try {
            const resp = await fetch(
                `/facebook/page-posts?page=${encodeURIComponent(page)}&limit=${limit}`
            );
            const data = await resp.json();

            if (data.error || !data.posts || !data.posts.length) {
                containerEl.innerHTML = "";
                return this._super(...arguments);
            }

            containerEl.innerHTML = this._buildGrid(data.posts);
        } catch (_) {
            containerEl.innerHTML = "";
        }

        return this._super(...arguments);
    },

    _loadingHTML() {
        return `<div class="s_facebook_loading"></div>`;
    },

    _buildGrid(posts) {
        const items = posts
            .map(
                (post) => `
            <a class="s_facebook_item"
               href="${this._escape(post.url)}"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="${this._escape(post.message || "Facebook post")}">
                <img src="${this._escape(post.image)}" alt="" loading="lazy"/>
                ${
                    post.message
                        ? `<div class="s_facebook_overlay">
                        <p>${this._escape(post.message)}</p>
                    </div>`
                        : ""
                }
            </a>`
            )
            .join("");

        return `<div class="s_facebook_grid">${items}</div>`;
    },

    _escape(str) {
        return (str || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
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
