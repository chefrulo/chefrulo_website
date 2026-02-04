/** @odoo-module **/

// Image modal for frozen page - click on cards to see larger image
console.log('Frozen image modal JS loaded!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready - frozen_image_modal.js');

    // Debug: Check page info
    const htmlEl = document.querySelector('html');
    const viewXmlid = htmlEl ? htmlEl.getAttribute('data-view-xmlid') : 'not found';
    const path = window.location.pathname;

    console.log('Page path:', path);
    console.log('data-view-xmlid:', viewXmlid);

    // Only run on frozen page (check both path and xmlid)
    if (path !== '/frozen' && viewXmlid !== 'website.frozen') {
        console.log('Not frozen page, skipping modal setup');
        return;
    }

    console.log('Frozen page detected, setting up modal...');

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

    // Find ALL cards with images on the page
    const allCards = document.querySelectorAll('.card');
    console.log('Found', allCards.length, 'cards');

    allCards.forEach((card, index) => {
        const img = card.querySelector('.card-img-top');
        if (!img) {
            console.log('Card', index, 'has no image, skipping');
            return;
        }

        console.log('Card', index, 'has image:', img.src.substring(0, 50) + '...');

        // Make card clickable
        card.style.cursor = 'pointer';

        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const title = card.querySelector('.card-title, h5, h4, h3');

            modalImg.src = img.src;
            modalImg.alt = img.alt || '';
            modalTitle.textContent = title ? title.textContent.trim() : '';

            console.log('Opening modal for:', modalTitle.textContent);

            // Show modal using Bootstrap
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        });
    });

    console.log('Frozen image modal: setup complete');
});
