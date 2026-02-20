document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('tickets-container');
    const userStr = localStorage.getItem('vortexCurrentUser');

    const eventImages = {
        "CODE RED: NIGHT": "https://image2url.com/r2/default/images/1771322980849-6dd25143-dab6-410b-a737-504b63aceea0.jpeg",
        "ELEVATE": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80",
        "DEBUGGING SPRINT": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80",
        "ALGO MASTERS": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80",
        "REACT DEEP DIVE": "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80",
        "TECH TRIVIA": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80",
        "UI/UX DASH": "https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&q=80",
        "CYBER DEFENSE": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80",
        "AI FRONTIERS": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80"
    };
    const defaultImage = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80";

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
        const dlQrContainer = document.getElementById('dl-qrcode');
        const imageUrl = eventImages[eventName.trim()] || defaultImage;
        dlQrContainer.innerHTML = `<img src="${imageUrl}" crossorigin="anonymous">`;

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
            const imageUrl = eventImages[ticket.event.trim()] || defaultImage;
            const ticketNumber = (index + 1).toString().padStart(2, '0');

            return `
            <div class="ticket-card" id="card-${ticket.ticketId}" data-number="${ticketNumber}">
                
                <div class="ticket-header-dynamic">
                    <span>${ticket.event || 'Unknown Event'}</span>
                    <span class="ticket-status-dynamic">${ticket.paymentStatus || 'PAID'}</span>
                </div>
                
                <div class="ticket-body-dynamic">
                    <div class="ticket-row">
                        <span class="ticket-label-muted">Ticket No:</span>
                        <span class="ticket-no-value">#${ticketNumber}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label-muted">Date:</span>
                        <span class="ticket-date-val">${ticket.date ? new Date(ticket.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label-muted">Attendee:</span>
                        <span class="ticket-name-val">${ticket.name || 'Participant'}</span>
                    </div>
                    <div class="ticket-brand-footer">
                        <div class="ticket-brand-text">VORTEX</div>
                        <div class="ticket-status-badge">
                            <div class="ticket-status-dot"></div> CONFIRMED
                        </div>
                    </div>

                    <h2 class="ticket-event-name">${ticket.event}</h2>

                    <div class="ticket-grid-details">
                        <div class="ticket-detail-col">
                            <span class="ticket-detail-label">Department:</span>
                            <span class="ticket-detail-val ticket-dept-val">${ticket.department || 'General'}</span>
                        </div>
                        <div class="ticket-detail-col">
                            <span class="ticket-detail-label">Ticket ID:</span>
                            <span class="ticket-detail-val">${ticket.ticketId}</span>
                        </div>
                    </div>

                    <div class="ticket-image-container">
                        <img src="${imageUrl}" alt="Event Image">
                    </div>
                    <button class="submit-btn download-ticket-btn download-btn-dynamic">
                        <i class="fas fa-download"></i> Download Ticket
                    </button>
                </div>
            </div>
            `}).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="loading-secure-data"><p class="error-text-tickets">Failed to load tickets. Is the server online?</p></div>';
    }
});
