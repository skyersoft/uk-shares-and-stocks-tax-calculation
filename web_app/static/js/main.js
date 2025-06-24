/**
 * Main JavaScript for UK Capital Gains Tax Calculator web app
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission with loading state
    const calculationForm = document.querySelector('form');
    if (calculationForm) {
        calculationForm.addEventListener('submit', function(e) {
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
                submitButton.disabled = true;
            }
            
            // Add loading class to the card
            const card = this.closest('.card');
            if (card) {
                card.classList.add('loading');
            }
        });
    }

    // File input enhancement
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            // Update label with filename
            const fileLabel = this.nextElementSibling;
            if (fileLabel && this.files.length > 0) {
                fileLabel.textContent = this.files[0].name;
            }
        });
    }

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-warning):not(.alert-info)');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});

// Function to copy table data to clipboard
function copyTableToClipboard(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let text = '';
    
    // Get headers
    const headers = table.querySelectorAll('thead th');
    if (headers.length) {
        const headerTexts = Array.from(headers).map(header => header.textContent.trim());
        text += headerTexts.join('\t') + '\n';
    }
    
    // Get rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowTexts = Array.from(cells).map(cell => cell.textContent.trim());
        text += rowTexts.join('\t') + '\n';
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(
        function() {
            // Success notification
            const notification = document.createElement('div');
            notification.className = 'position-fixed bottom-0 end-0 p-3';
            notification.style.zIndex = '5';
            notification.innerHTML = `
                <div class="toast show" role="alert">
                    <div class="toast-header">
                        <strong class="me-auto">Notification</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body">Table data copied to clipboard!</div>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        },
        function(err) {
            console.error('Could not copy text: ', err);
        }
    );
}
