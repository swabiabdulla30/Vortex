document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('tickets-container');
    const userStr = localStorage.getItem('vortexCurrentUser');

    // Images and details are read dynamically from events_data.js (single source of truth).
    // To update an event image, just change the `image` field in events_data.js.
    const defaultImage = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80";

    function getEventImage(eventName) {
        if (!eventName) return defaultImage;
        const cleanName = eventName.trim().toUpperCase();
        if (typeof eventDetails !== 'undefined' && eventDetails[cleanName]) {
            return eventDetails[cleanName].image || defaultImage;
        }
        return defaultImage;
    }

    // Define downloadTicket function
    function downloadTicket(btn) {
        const card = btn.closest('.ticket-card');
        const originalText = btn.innerHTML;

        // UI Feedback
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        btn.disabled = true;

        // Data Extraction from DOM
        const ticketId = card.id.replace('card-', '');
        const ticketNumber = card.dataset.number;
        const eventName = card.querySelector('.ticket-header-dynamic span:first-child').innerText;

        // Revised selectors to match new class-based structure
        const name = card.querySelector('.ticket-name-val').innerText;
        const date = card.querySelector('.ticket-date-val').innerText;
        const dept = card.querySelector('.ticket-dept-val').innerText;

        console.log("Preparing download for:", { ticketId, ticketNumber, eventName, name, date, dept });

        // Populate Hidden High-Res Template
        document.getElementById('dl-event').innerText = eventName;
        document.getElementById('dl-name').innerText = name;
        document.getElementById('dl-dept').innerText = dept;
        document.getElementById('dl-date').innerText = date;
        document.getElementById('dl-id').innerText = 'NO: #' + ticketNumber;

        // Render Event Image
        const dlImageContainer = document.getElementById('dl-event-image');
        const imageUrl = getEventImage(eventName.trim());
        dlImageContainer.src = imageUrl;
        dlImageContainer.crossOrigin = "anonymous";

        const originalTicket = document.querySelector('.downloadable-ticket');
        const clone = originalTicket.cloneNode(true);
        clone.id = 'temp-capture-target';
        document.body.appendChild(clone);

        // Capture settings (these are handled via JS but avoided where CSS can do it)
        // Note: position/left/etc are for html2canvas capture logic, technically not 'styling' the visible page
        // but let's keep it safe.
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '-9999px';
        clone.style.zIndex = '-9999';
        clone.style.visibility = 'visible';

        // Short delay for image to render
        setTimeout(() => {
            html2canvas(clone, {
                backgroundColor: '#050505',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: 1200,
                height: 630,
                windowWidth: 1200,
                windowHeight: 630
            }).then(canvas => {
                try {
                    const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                    const link = document.createElement('a');
                    link.download = `Vortex_Official_Pass_${ticketId}.png`;
                    link.href = image;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Success Feedback
                    btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }, 2000);

                } catch (e) {
                    console.error("Save Error:", e);
                    alert("Browser blocked the download.");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                } finally {
                    if (document.body.contains(clone)) document.body.removeChild(clone);
                }
            }).catch(err => {
                console.error("Capture Error:", err);
                alert("Failed to generate ticket image.");
                btn.innerHTML = originalText;
                btn.disabled = false;
                if (document.body.contains(clone)) document.body.removeChild(clone);
            });
        }, 500);
    }

    // Event Delegation for Download Buttons
    if (container) {
        container.addEventListener('click', function (e) {
            const btn = e.target.closest('.download-ticket-btn');
            if (btn) {
                downloadTicket(btn);
            }
        });
    }

    if (!userStr) {
        container.innerHTML = `
            <div class="loading-secure-data">
                <p>Please login to view your tickets.</p>
                <a href="login.html" class="submit-btn login-link-tickets">LOGIN NOW</a>
            </div>
        `;
        // Add style for login link in style_tickets.css if not there
        return;
    }

    const user = JSON.parse(userStr);
    if (!user.email) {
        container.innerHTML = '<p class="loading-secure-data">User email not found. Please re-login.</p>';
        return;
    }

    try {
        const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
            && window.location.port !== '5000'
            ? "http://127.0.0.1:5000/api"
            : "/api";

        const res = await fetch(`${API_URL}/my-tickets?email=${encodeURIComponent(user.email)}`);
        const tickets = await res.json();

        if (tickets.length === 0) {
            container.innerHTML = `
                <div class="loading-secure-data">
                    <i class="fas fa-ticket-alt no-tickets-icon"></i>
                    <p class="no-tickets-msg">No active tickets found.</p>
                    <p>Ready to join the action?</p>
                    <a href="events.html" class="submit-btn browse-btn-tickets">BROWSE EVENTS</a>
                </div>
            `;
            return;
        }

        container.innerHTML = tickets.map((ticket, index) => {
            const eventName = (ticket.event || "UNKNOWN EVENT").trim();
            const imageUrl = getEventImage(eventName);
            const ticketNumber = (index + 1).toString().padStart(2, '0');
            const displayDate = ticket.date ? new Date(ticket.date).toLocaleDateString() : 'TBA';

            return `
            <div class="ticket-card digital-ticket" id="card-${ticket.ticketId}" data-number="${ticketNumber}">
                <div class="ticket-left">
                    <div class="ticket-header-dynamic">
                        <div class="ticket-brand-text">VORTEX</div>
                        <span class="ticket-status-dynamic">${ticket.paymentStatus || 'PAID'}</span>
                    </div>
                    
                    <h2 class="ticket-event-name">${eventName}</h2>
                    
                    <div class="ticket-grid-details">
                        <div class="ticket-detail-col">
                            <span class="ticket-detail-label">ATTENDEE</span>
                            <span class="ticket-detail-val ticket-name-val">${ticket.name || 'Participant'}</span>
                        </div>
                        <div class="ticket-detail-col">
                            <span class="ticket-detail-label">DEPARTMENT</span>
                            <span class="ticket-detail-val ticket-dept-val">${ticket.department || 'General'}</span>
                        </div>
                        <div class="ticket-detail-col">
                            <span class="ticket-detail-label">DATE</span>
                            <span class="ticket-detail-val ticket-date-val">${displayDate}</span>
                        </div>
                        <div class="ticket-detail-col">
                            <span class="ticket-detail-label">TICKET NO</span>
                            <span class="ticket-detail-val ticket-no-value">#${ticketNumber}</span>
                        </div>
                    </div>

                    <div class="ticket-footer-action">
                        <button class="submit-btn download-ticket-btn download-btn-dynamic">
                            <i class="fas fa-download"></i> SAVE OFFICIAL PASS
                        </button>
                    </div>
                </div>

                <div class="ticket-right">
                    <div class="ticket-image-container">
                        <img src="${imageUrl}" alt="${eventName}" class="ticket-event-image-full">
                    </div>
                    <div class="ticket-id-badge">ID: #${ticket.ticketId}</div>
                    <div class="admit-one">ADMIT ONE</div>
                </div>
            </div>
            `}).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="loading-secure-data"><p class="error-text-tickets">Failed to load tickets. Is the server online?</p></div>';
    }
});
