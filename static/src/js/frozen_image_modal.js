/** @odoo-module **/

// Image modal popup - click on images with class "o_popup_image" to see larger version

function initImagePopupModal() {
    // Check if modal already exists
    if (document.getElementById('imagePopupModal')) {
        return;
    }

    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="imagePopupModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content bg-dark border-0">
                    <div class="modal-header border-0">
                        <h5 class="modal-title text-white" id="imagePopupModalTitle"></h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center p-4">
                        <img id="imagePopupModalImg" src="" alt="" class="img-fluid rounded" style="max-height: 70vh;">
                    </div>
                </div>
            </div>
        </div>
    `;

    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal elements
    const modalElement = document.getElementById('imagePopupModal');
    const modalImg = document.getElementById('imagePopupModalImg');
    const modalTitle = document.getElementById('imagePopupModalTitle');

    // Attach click handlers to popup images
    function attachPopupHandlers() {
        // Find all images with the o_popup_image class
        const popupImages = document.querySelectorAll('img.o_popup_image');

        popupImages.forEach(img => {
            // Skip if already initialized
            if (img._popupInitialized) return;
            img._popupInitialized = true;

            // Make image clickable
            img.style.cursor = 'pointer';

            img.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Get title from data attribute or nearby elements
                let title = img.dataset.popupTitle || '';
                if (!title) {
                    const container = img.closest('.card, .col, div');
                    const titleEl = container ? container.querySelector('.card-title, h1, h2, h3, h4, h5, h6') : null;
                    title = titleEl ? titleEl.textContent.trim() : (img.alt || '');
                }

                modalImg.src = img.src;
                modalImg.alt = img.alt || '';
                modalTitle.textContent = title;

                // Show modal using Bootstrap
                $(modalElement).modal('show');
            });
        });
    }

    // Initial attachment
    attachPopupHandlers();

    // Watch for dynamically added images (for Website Builder and dynamic content)
    const observer = new MutationObserver(function(mutations) {
        let hasNewImages = false;
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'IMG' && node.classList.contains('o_popup_image')) {
                            hasNewImages = true;
                        } else if (node.querySelector) {
                            if (node.querySelector('img.o_popup_image')) {
                                hasNewImages = true;
                            }
                        }
                    }
                });
            }
        });
        if (hasNewImages) {
            attachPopupHandlers();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImagePopupModal);
} else {
    setTimeout(initImagePopupModal, 100);
}
