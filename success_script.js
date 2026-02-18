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
        setText('ticket-id', 'ID: #' + id);
        setText('ticket-date', currentDate);

        // Populate HIDDEN DOWNLOAD Ticket
        setText('dl-name', name);
        setText('dl-event', event);
        setText('dl-dept', dept);
        setText('dl-id', 'ID: #' + id);
        setText('dl-date', currentDate);

        // Generate QR Code for Screen
        const qrContainer = document.querySelector('.ticket-right .qr-placeholder');
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: id,
                width: 120,
                height: 120,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            console.warn("QR Container missing or QRCode library not loaded");
        }

        // Generate QR Code for Download Ticket (High Res)
        const dlQrContainerWrapper = document.querySelector('.downloadable-ticket .fa-qrcode');
        const dlQrContainer = dlQrContainerWrapper ? dlQrContainerWrapper.parentElement : null;

        if (dlQrContainer && typeof QRCode !== 'undefined') {
            dlQrContainer.innerHTML = '';
            new QRCode(dlQrContainer, {
                text: id,
                width: 180,
                height: 180,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            console.warn("Download QR Container missing or QRCode library not loaded");
        }
    } catch (e) {
        console.error("Error in window.onload:", e);
    }
});
