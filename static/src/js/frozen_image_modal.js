/** @odoo-module **/

// Image modal for frozen page - click on flavor cards to see larger image
document.addEventListener('DOMContentLoaded', function() {
    // Only run on frozen page
    if (!document.querySelector('html[data-view-xmlid="website.frozen"]')) {
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
                    <div class="modal-body text-center p-0">
                        <img id="frozenImageModalImg" src="" alt="" class="img-fluid rounded">
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

    // Find all flavor cards (the s_three_columns with 6 columns for flavors)
    const flavorSection = document.querySelector('.s_three_columns .row');
    if (!flavorSection) return;

    // Add click handlers to cards
    const cards = flavorSection.querySelectorAll('.card');
    cards.forEach(card => {
        // Make card clickable
        card.style.cursor = 'pointer';

        card.addEventListener('click', function(e) {
            e.preventDefault();

            const img = card.querySelector('.card-img-top');
            const title = card.querySelector('.card-title');

            if (img) {
                modalImg.src = img.src;
                modalImg.alt = img.alt || '';
            }

            if (title) {
                modalTitle.textContent = title.textContent;
            }

            // Show modal using Bootstrap
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        });
    });
});
