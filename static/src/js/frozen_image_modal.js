/** @odoo-module **/

// Image modal for frozen page - click on cards to see larger image

function initFrozenImageModal() {
    const path = window.location.pathname;
    const htmlEl = document.querySelector('html');
    const viewXmlid = htmlEl ? htmlEl.getAttribute('data-view-xmlid') : null;

    // Only run on frozen page
    if (path !== '/frozen' && viewXmlid !== 'website.frozen') {
        return;
    }

    // Check if modal already exists
    if (document.getElementById('frozenImageModal')) {
        return;
    }

    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="frozenImageModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content bg-dark border-0">
                    <div class="modal-header border-0">
                        <h5 class="modal-title text-white" id="frozenImageModalTitle"></h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center p-4">
                        <img id="frozenImageModalImg" src="" alt="" class="img-fluid rounded" style="max-height: 70vh;">
                    </div>
                </div>
            </div>
        </div>
    `;

    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal elements
    const modalElement = document.getElementById('frozenImageModal');
    const modalImg = document.getElementById('frozenImageModalImg');
    const modalTitle = document.getElementById('frozenImageModalTitle');

    // Find all cards with images on the page
    const allCards = document.querySelectorAll('.card');

    allCards.forEach(card => {
        const img = card.querySelector('.card-img-top');
        if (!img) return;

        // Make card clickable
        card.style.cursor = 'pointer';

        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const title = card.querySelector('.card-title, h5, h4, h3');

            modalImg.src = img.src;
            modalImg.alt = img.alt || '';
            modalTitle.textContent = title ? title.textContent.trim() : '';

            // Show modal using jQuery
            $(modalElement).modal('show');
        });
    });
}

// With @odoo-module, DOMContentLoaded has already fired
// So we run immediately with a small delay to ensure page is fully rendered
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFrozenImageModal);
} else {
    setTimeout(initFrozenImageModal, 100);
}
