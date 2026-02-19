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
        const ticketNumber = card.dataset.number; // Get numbered index
        const eventName = card.querySelector('.ticket-header span:first-child').innerText;
        // Selectors based on structure
        const name = card.querySelector('.ticket-body > div:nth-child(3) > span:nth-child(2)').innerText;
        const date = card.querySelector('.ticket-body > div:nth-child(2) > span:nth-child(2)').innerText;
        const dept = card.querySelector('.ticket-body > div:nth-child(4) > span:nth-child(2)').innerText;

        console.log("Preparing download for:", { ticketId, ticketNumber, eventName, name, date, dept });

        // Populate Hidden High-Res Template
        document.getElementById('dl-event').innerText = eventName;
        document.getElementById('dl-name').innerText = name;
        document.getElementById('dl-dept').innerText = dept;
        document.getElementById('dl-date').innerText = date;
        document.getElementById('dl-id').innerText = 'NO: #' + ticketNumber;

        // Render Event Image instead of QR
        const dlQrContainer = document.getElementById('dl-qrcode');
        const imageUrl = eventImages[eventName.trim()] || defaultImage;
        dlQrContainer.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" crossorigin="anonymous">`;

        // Target the template
        const originalTicket = document.querySelector('.downloadable-ticket');

        // Clone strategy to ensure clean capture
        const clone = originalTicket.cloneNode(true);
        clone.id = 'temp-capture-target';
        document.body.appendChild(clone);

        // Styling for capture - OFF SCREEN TO PREVENT FLICKER
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '-9999px'; // Hidden from view
        clone.style.width = '1200px';
        clone.style.height = '630px';
        clone.style.zIndex = '-9999';
        clone.style.visibility = 'visible'; // Visible to html2canvas

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
        }, 500); // Increased delay slightly for image loading
    }

    // Event Delegation for Download Buttons
    if (container) {
        container.addEventListener('click', function (e) {
            // Check if clicked element is download button or its child
            const btn = e.target.closest('.download-ticket-btn');
            if (btn) {
                downloadTicket(btn);
            }
        });
    }

    if (!userStr) {
        container.innerHTML = `
            <div style="text-align: center; color: white; width: 100%;">
                <p>Please login to view your tickets.</p>
                <a href="login.html" class="submit-btn" style="display: inline-block; margin-top: 20px; text-decoration: none;">LOGIN NOW</a>
            </div>
        `;
        return;
    }

    const user = JSON.parse(userStr);
    if (!user.email) {
        container.innerHTML = '<p style="color: white;">User email not found. Please re-login.</p>';
        return;
    }

    try {
        // Determine API URL (Handle Dev Environment)
        const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
            && window.location.port !== '5000'
            ? "http://127.0.0.1:5000/api"
            : "/api";

        const res = await fetch(`${API_URL}/my-tickets?email=${encodeURIComponent(user.email)}`);
        const tickets = await res.json();

        console.log("Fetched Tickets:", tickets); // USER DEBUG LOG

        if (tickets.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: rgba(255,255,255,0.7); width: 100%;">
                    <i class="fas fa-ticket-alt" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 1.5rem;">No active tickets found.</p>
                    <p style="margin-top: 10px;">Ready to join the action?</p>
                    <a href="events.html" class="submit-btn" style="display: inline-block; margin-top: 20px; text-decoration: none;">BROWSE EVENTS</a>
                </div>
            `;
            return;
        }

        container.innerHTML = tickets.map((ticket, index) => {
            const imageUrl = eventImages[ticket.event.trim()] || defaultImage;
            const ticketNumber = (index + 1).toString().padStart(2, '0');

            return `
            <div class="ticket-card" id="card-${ticket.ticketId}" data-number="${ticketNumber}" style="
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                width: 350px;
                overflow: hidden;
                backdrop-filter: blur(10px);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                position: relative;
                margin: 10px;
            " onmouseover="this.style.transform='translateY(-10px)'; this.style.boxShadow='0 10px 30px rgba(0,255,213,0.2)'" 
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                
                <div class="ticket-header" style="
                    background: linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%);
                    padding: 15px;
                    color: #000;
                    font-weight: bold;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>${ticket.event || 'Unknown Event'}</span>
                    <span style="background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${ticket.paymentStatus || 'PAID'}</span>
                </div>
                
                <div class="ticket-body" style="padding: 20px; color: white;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #888;">Ticket No:</span>
                        <span style="color: #00ffd5; font-family: monospace; font-size: 1.2rem; font-weight: bold;">#${ticketNumber}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #888;">Date:</span>
                        <span>${ticket.date ? new Date(ticket.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #888;">Attendee:</span>
                        <span>${ticket.name || 'Participant'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #888;">Department:</span>
                        <span>${ticket.department || 'General'}</span>
                    </div>
                    <div style="text-align: center; margin-top: 20px; border-radius: 10px; width: 100%; height: 180px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                        <img src="${imageUrl}" alt="Event Image" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <button class="submit-btn download-ticket-btn" style="width: 100%; margin-top: 15px; background: rgba(0, 255, 213, 0.2); border: 1px solid #00ffd5;">
                        <i class="fas fa-download"></i> Download Ticket
                    </button>
                </div>
            </div>
        `}).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div style="text-align: center; width: 100%;"><p style="color: #ff4444;">Failed to load tickets. Is the server online?</p></div>';
    }
});
