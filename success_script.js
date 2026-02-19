console.log("Registration Success Script Loading...");

// Function to handle the download logic
function handleTicketDownload() {
    console.log("downloadTicket called");
    const saveBtn = document.querySelector('.save-btn');
    const originalContent = saveBtn.innerHTML;

    // source element
    const originalTicket = document.querySelector('.downloadable-ticket');
    if (!originalTicket) {
        console.error("Original ticket element not found");
        alert("Error: Ticket template missing.");
        return;
    }

    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    saveBtn.style.pointerEvents = 'none'; // Prevent double clicks

    if (typeof html2canvas === 'undefined') {
        console.error("html2canvas is undefined");
        alert("Error: Canvas library not loaded. Please allow the page to load fully.");
        saveBtn.innerHTML = originalContent;
        saveBtn.style.pointerEvents = 'auto';
        return;
    }

    try {
        // CLONE STRATEGY:
        const clone = originalTicket.cloneNode(true);
        // Add a unique ID for safe retrieval in onclone
        clone.id = 'temp-capture-target';
        document.body.appendChild(clone);

        // Set styles to ensure it renders correctly for capture but is HIDDEN from user
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.width = '1200px';
        clone.style.height = '630px';
        clone.style.zIndex = '-9999';
        clone.style.display = 'flex';
        // VISIBILITY HACK: Opacity 0 makes it invisible to user, but html2canvas captures it if we toggle it back in onclone
        clone.style.opacity = '0';

        // Wait a moment for DOM to settle
        setTimeout(() => {
            html2canvas(clone, {
                backgroundColor: '#050505',
                scale: 2,
                useCORS: true,
                logging: false, // Reduced logging
                allowTaint: true,
                width: 1200,
                height: 630,
                windowWidth: 1200,
                windowHeight: 630,
                onclone: (clonedDoc) => {
                    // Make it visible to the renderer
                    const el = clonedDoc.getElementById('temp-capture-target');
                    if (el) {
                        el.style.opacity = '1';
                        el.style.visibility = 'visible';
                    }
                    console.log("Ticket cloned for capture");
                }
            }).then(canvas => {
                try {
                    const idElem = document.getElementById('ticket-id');
                    const id = idElem ? idElem.innerText.replace('ID: #', '') : 'TICKET';

                    const link = document.createElement('a');
                    link.download = `Vortex_Pass_${id}.png`;
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                    setTimeout(() => {
                        saveBtn.innerHTML = originalContent;
                        saveBtn.style.pointerEvents = 'auto';
                    }, 2000);

                } catch (e) {
                    console.error("Download handling error:", e);
                    alert("Browser blocked download. Please screenshot.");
                    saveBtn.innerHTML = originalContent;
                    saveBtn.style.pointerEvents = 'auto';
                } finally {
                    if (document.body.contains(clone)) document.body.removeChild(clone);
                }
            }).catch(err => {
                console.error("Capture Error:", err);
                alert("Failed to generate image: " + err.message);
                saveBtn.innerHTML = originalContent;
                saveBtn.style.pointerEvents = 'auto';
                if (document.body.contains(clone)) document.body.removeChild(clone);
            });
        }, 100);
    } catch (e) {
        console.error("Setup Error:", e);
        saveBtn.innerHTML = originalContent;
        saveBtn.style.pointerEvents = 'auto';
    }
}

// Initialize page
window.addEventListener('load', function () {
    console.log("Window loaded, populating ticket...");

    // Attach event listener to download button
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleTicketDownload);
    } else {
        console.error("Save button not found!");
    }

    try {
        // Retrieve data from sessionStorage
        const name = sessionStorage.getItem('regName') || 'Guest';
        const event = sessionStorage.getItem('regEvent') || 'Vortex Event';
        const dept = sessionStorage.getItem('regDept') || 'General';
        const id = sessionStorage.getItem('regId') || 'VTX-' + Math.floor(Math.random() * 100000);

        // Generate current date
        const now = new Date();
        const dateOptions = { month: 'short', day: '2-digit', year: 'numeric' };
        const currentDate = now.toLocaleDateString('en-US', dateOptions).toUpperCase();

        // Helper to safely set text
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        // Populate ON-SCREEN Ticket
        setText('ticket-name', name);
        setText('ticket-event', event);
        setText('ticket-dept', dept);

        // Use a temporary ID for display since DB hasn't assigned a sequential number yet
        // In a real app, you might want to fetch the next sequence number or just show "PENDING"
        // For now, we'll strip the "VTX-" and show a random 2 digit number for aesthetics or "01"
        const displayId = "01"; // Defaulting to 01 for the success view as a preview
        setText('ticket-id', 'NO: #' + displayId);
        setText('ticket-date', currentDate);

        // Populate HIDDEN DOWNLOAD Ticket
        setText('dl-name', name);
        setText('dl-event', event);
        setText('dl-dept', dept);
        setText('dl-id', 'NO: #' + displayId);
        setText('dl-date', currentDate);

        // Event Images Map
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

        const imageUrl = eventImages[event.trim()] || defaultImage;

        // Set Images
        const ticketImage = document.getElementById('ticket-event-image');
        if (ticketImage) ticketImage.src = imageUrl;

        const dlImage = document.getElementById('dl-event-image');
        if (dlImage) dlImage.src = imageUrl;

        console.error("Error in window.onload:", e);
    }
});
