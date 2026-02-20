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
    saveBtn.classList.add('btn-disabled-state');

    if (typeof html2canvas === 'undefined') {
        console.error("html2canvas is undefined");
        alert("Error: Canvas library not loaded. Please allow the page to load fully.");
        saveBtn.innerHTML = originalContent;
        saveBtn.classList.remove('btn-disabled-state');
        return;
    }

    try {
        // CLONE STRATEGY:
        const clone = originalTicket.cloneNode(true);
        // Add a unique ID for safe retrieval
        clone.id = 'temp-capture-target';

        // Use CSS class for hidden capture target instead of inline styles
        clone.classList.add('capture-target-hidden');
        document.body.appendChild(clone);

        // Wait a moment for DOM to settle
        setTimeout(() => {
            html2canvas(clone, {
                backgroundColor: '#050505',
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                width: 1200,
                height: 630,
                windowWidth: 1200,
                windowHeight: 630,
                onclone: (clonedDoc) => {
                    // Make it visible to the renderer via class
                    const el = clonedDoc.getElementById('temp-capture-target');
                    if (el) {
                        el.classList.remove('capture-target-hidden');
                        el.classList.add('capture-target-visible');
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
                        saveBtn.classList.remove('btn-disabled-state');
                    }, 2000);

                } catch (e) {
                    console.error("Download handling error:", e);
                    alert("Browser blocked download. Please screenshot.");
                    saveBtn.innerHTML = originalContent;
                    saveBtn.classList.remove('btn-disabled-state');
                } finally {
                    if (document.body.contains(clone)) document.body.removeChild(clone);
                }
            }).catch(err => {
                console.error("Capture Error:", err);
                alert("Failed to generate image: " + err.message);
                saveBtn.innerHTML = originalContent;
                saveBtn.classList.remove('btn-disabled-state');
                if (document.body.contains(clone)) document.body.removeChild(clone);
            });
        }, 100);
    } catch (e) {
        console.error("Setup Error:", e);
        saveBtn.innerHTML = originalContent;
        saveBtn.classList.remove('btn-disabled-state');
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

        // Preview ID
        const displayId = "01";
        setText('ticket-id', 'NO: #' + displayId);
        setText('ticket-date', currentDate);

        // Populate HIDDEN DOWNLOAD Ticket
        setText('dl-name', name);
        setText('dl-event', event);
        setText('dl-dept', dept);
        setText('dl-id', 'NO: #' + displayId);
        setText('dl-date', currentDate);

        // Event image is read from events_data.js (single source of truth).
        // To update, just change the `image` field in events_data.js.
        const defaultImage = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80";
        const imageUrl = (typeof eventDetails !== 'undefined' && eventDetails[event.trim()])
            ? (eventDetails[event.trim()].image || defaultImage)
            : defaultImage;

        // Set Images
        const ticketImage = document.getElementById('ticket-event-image');
        if (ticketImage) ticketImage.src = imageUrl;

        const dlImage = document.getElementById('dl-event-image');
        if (dlImage) dlImage.src = imageUrl;

    } catch (e) {
        console.error("Error in window.onload:", e);
    }
});
