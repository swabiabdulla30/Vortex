// ============================================================
// VORTEX - SUB-EVENTS ADMIN SCRIPT (INSIDE EVENT CARDS)
// Handles creating, editing, and deleting games & competitions inside each event
// ============================================================

(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const currentEvent = (urlParams.get('event') || 'ELEVATE').trim();

    let loadedSubEvents = [];
    let currentImageMode = 'upload';
    let currentImageBase64 = '';

    function checkIsAdmin() {
        try {
            const userStr = localStorage.getItem('vortexCurrentUser');
            const token = localStorage.getItem('vortexToken');
            const user = userStr ? JSON.parse(userStr) : null;
            return Boolean(user && user.role === 'admin' && token);
        } catch (e) {
            return false;
        }
    }

    const isAdmin = checkIsAdmin();

    const staticElevateEvents = [
        {
            _id: 'static_bgmi',
            isStatic: true,
            title: 'BGMI',
            subtitle: 'Together till the last circle.',
            parentEvent: 'ELEVATE',
            imageUrl: 'https://image2url.com/r2/default/images/1772176721946-d99583c6-5bb0-4e52-8e9e-781fa092d280.jpeg',
            date: 'MAR 06',
            venue: 'SEMINAR HALL',
            prize: '₹300',
            status: 'OPEN'
        },
        {
            _id: 'static_techhunt',
            isStatic: true,
            title: 'Tech Hunt',
            subtitle: 'Hunt through the web, find the prize.',
            parentEvent: 'ELEVATE',
            imageUrl: 'https://image2url.com/r2/default/images/1771996030667-7810be98-c833-4915-9f82-6059bb4f7259.jpeg',
            date: 'MAR 05',
            venue: 'LAB',
            prize: '₹200',
            status: 'OPEN'
        },
        {
            _id: 'static_webdesign',
            isStatic: true,
            title: 'Web-Designing',
            subtitle: 'Design your way to the top.',
            parentEvent: 'ELEVATE',
            imageUrl: 'https://image2url.com/r2/default/images/1771995989097-15167040-638c-48cd-a3c0-e93ddb26f811.jpeg',
            date: 'MAR 05',
            venue: 'LAB',
            prize: '₹200',
            status: 'OPEN'
        },
        {
            _id: 'static_efootball',
            isStatic: true,
            title: 'Co-op E-Football',
            subtitle: 'Kick off, game on, glory awaits.',
            parentEvent: 'ELEVATE',
            imageUrl: 'https://image2url.com/r2/default/images/1771995899025-6821ca81-aa54-4566-b29d-4fab70571c09.jpeg',
            date: 'MAR 06',
            venue: 'SEMINAR HALL',
            prize: '₹200',
            status: 'OPEN'
        },
        {
            _id: 'static_quiz',
            isStatic: true,
            title: 'Tech Quiz',
            subtitle: 'Test your knowledge, claim the prize.',
            parentEvent: 'ELEVATE',
            imageUrl: 'https://image2url.com/r2/default/images/1772440085076-0f0df1c1-a19a-4351-aa02-27f67b111fa8.jpeg',
            date: 'MAR 05',
            venue: 'LAB',
            prize: '',
            status: 'OPEN'
        },
        {
            _id: 'static_paperx',
            isStatic: true,
            title: 'Paper-X',
            subtitle: 'Think Beyond Circuits',
            parentEvent: 'ELEVATE',
            imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80',
            date: 'MAR 06',
            venue: 'SEMINAR HALL',
            prize: '',
            status: 'OPEN'
        }
    ];

    async function initElevatePage() {
        // Update Title and Headers
        document.title = `${currentEvent} Series - Vortex Innovators`;
        const titleEl = document.getElementById('series-event-title');
        if (titleEl) titleEl.textContent = currentEvent.toUpperCase();

        const currentNameEl = document.getElementById('admin-current-event-name');
        if (currentNameEl) currentNameEl.textContent = currentEvent;

        const adminBar = document.getElementById('admin-subevents-bar');
        if (isAdmin && adminBar) {
            adminBar.style.display = 'flex';
        }

        setupSubEventModal();
        await loadAndRenderSubEvents();
    }

    async function loadAndRenderSubEvents() {
        const grid = document.querySelector('#code-red-events .cards-grid');
        if (!grid) return;

        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const allEvents = await res.json();
                if (Array.isArray(allEvents)) {
                    // Filter sub-events for the current parent event
                    loadedSubEvents = allEvents.filter(e => {
                        const parent = (e.parentEvent || '').trim().toUpperCase();
                        const isCurrentParent = parent === currentEvent.toUpperCase();
                        const isSubEvent = e.eventType !== 'main_event' && (e.category || '').toLowerCase() !== 'session';
                        
                        if (currentEvent.toUpperCase() === 'ELEVATE') {
                            return isCurrentParent || (!e.parentEvent && isSubEvent);
                        }
                        return isCurrentParent;
                    });
                }
            }
        } catch (err) {
            console.warn('Could not fetch sub-events from API, using fallback:', err);
        }

        renderSubEventsGrid();
    }

    function renderSubEventsGrid() {
        const grid = document.querySelector('#code-red-events .cards-grid');
        if (!grid) return;

        let displayList = [];
        if (currentEvent.toUpperCase() === 'ELEVATE') {
            // Merge static events with dynamic ones (dynamic with same title takes precedence)
            const dynamicTitles = new Set(loadedSubEvents.map(e => e.title.trim().toUpperCase()));
            const nonOverriddenStatic = staticElevateEvents.filter(e => !dynamicTitles.has(e.title.trim().toUpperCase()));
            displayList = [...loadedSubEvents, ...nonOverriddenStatic];
        } else {
            displayList = loadedSubEvents;
        }

        if (displayList.length === 0 && !isAdmin) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.7);">
                    <i class="fas fa-calendar-alt" style="font-size: 3rem; color: #00ff88; margin-bottom: 16px; opacity: 0.6;"></i>
                    <h3 style="font-size: 1.5rem; color: #fff; margin-bottom: 8px;">No Competitions Announced Yet</h3>
                    <p style="max-width: 450px; margin: 0 auto;">Events and games for ${escapeHtml(currentEvent)} are being finalized. Check back soon for registration details!</p>
                </div>
            `;
            return;
        }

        let cardsHtml = displayList.map(evt => {
            const isClosed = (evt.status || 'OPEN').toUpperCase() === 'CLOSED';
            const dateParts = parseDateString(evt.date);
            const regUrl = `event_registration.html?event=${encodeURIComponent(evt.title)}`;

            let statusBadge = '';
            if (isAdmin) {
                statusBadge = isClosed
                    ? `<div class="card-status status-active" style="background: rgba(255, 170, 0, 0.2); color: #ffaa00; border-color: rgba(255,170,0,0.5);">● CLOSED (ADMIN OPEN)</div>`
                    : `<div class="card-status status-active">● REGISTRATION OPEN</div>`;
            } else {
                statusBadge = isClosed
                    ? `<div class="card-status status-soon">REGISTRATION CLOSED</div>`
                    : `<div class="card-status status-active">● REGISTRATION OPEN</div>`;
            }

            const adminToolbar = (isAdmin && !evt.isStatic) ? `
                <div class="card-admin-bar">
                    <button class="card-admin-btn edit" data-id="${evt._id}" title="Edit this event">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="card-admin-btn delete" data-id="${evt._id}" data-title="${escapeHtml(evt.title)}" title="Delete this event">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : '';

            const prizeMarkup = evt.prize ? `
                <span class="prize-badge"><i class="fas fa-trophy" style="color: gold;"></i> ${escapeHtml(evt.prize)}</span>
            ` : '';

            return `
            <a href="${regUrl}" class="card event-card" data-event="${escapeHtml(evt.title)}" style="text-decoration: none; color: inherit; cursor: pointer; position: relative;">
                ${adminToolbar}
                ${statusBadge}
                <div class="card-image">
                    <img src="${evt.imageUrl || 'https://via.placeholder.com/400x250?text=Event'}"
                        alt="${escapeHtml(evt.title)}" loading="lazy"
                        onerror="this.src='https://via.placeholder.com/400x250?text=Event';">
                </div>
                <div class="card-content">
                    <div class="date-badge">
                        <span class="month">${dateParts.month}</span>
                        <span class="day">${dateParts.day}</span>
                    </div>
                    <div class="event-details">
                        <span class="event-type"></span>
                        <h3>${escapeHtml(evt.title)}</h3>
                        <p>${escapeHtml(evt.subtitle || evt.description || '')}</p>
                        <div class="card-footer">
                            <span class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(evt.venue || 'KMCT IETM')}</span>
                            ${prizeMarkup}
                            <span class="arrow">→</span>
                        </div>
                    </div>
                </div>
            </a>
            `;
        }).join('');

        // If admin, append "+ Add Competition / Game" slot
        if (isAdmin) {
            cardsHtml += `
            <div class="card event-card card-add-placeholder" id="add-sub-event-card-slot" style="cursor: pointer;">
                <div class="add-card-inner">
                    <div class="add-card-icon-wrap">
                        <i class="fas fa-plus"></i>
                    </div>
                    <h3>ADD EVENT / GAME</h3>
                    <p>Create a new competition or game conducted under ${escapeHtml(currentEvent)}</p>
                    <span class="add-card-badge">+ NEW COMPETITION</span>
                </div>
            </div>
            `;
        }

        grid.innerHTML = cardsHtml;
        attachSubCardListeners();
    }

    function attachSubCardListeners() {
        document.getElementById('add-sub-event-card-slot')?.addEventListener('click', () => {
            openSubEventModal();
        });

        // Edit buttons
        document.querySelectorAll('.card-admin-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const item = loadedSubEvents.find(x => x._id === id);
                if (item) {
                    openSubEventModal(item);
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.card-admin-btn.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const title = btn.getAttribute('data-title') || 'this event';

                if (!confirm(`Are you sure you want to remove "${title}" from ${currentEvent}?`)) {
                    return;
                }

                const token = localStorage.getItem('vortexToken');
                if (!token) {
                    alert('Session expired. Please log in.');
                    return;
                }

                try {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                    const res = await fetch(`/api/admin/events/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Failed to delete event');
                    }

                    alert(`Event "${title}" removed successfully!`);
                    await loadAndRenderSubEvents();
                } catch (err) {
                    console.error('Delete error:', err);
                    alert('Error: ' + err.message);
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-trash"></i>';
                }
            });
        });
    }

    function setupSubEventModal() {
        const modal = document.getElementById('vortex-sub-event-modal');
        const closeBtn = document.getElementById('close-sub-event-modal');
        const cancelBtn = document.getElementById('cancel-sub-event-modal');
        const form = document.getElementById('vortex-sub-event-form');
        const openBarBtn = document.getElementById('open-create-sub-event-btn');

        if (openBarBtn) {
            openBarBtn.addEventListener('click', () => openSubEventModal());
        }

        function closeModal() {
            if (modal) modal.classList.remove('active');
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        // Image mode tabs
        const tabUpload = document.getElementById('sub-event-tab-upload');
        const tabUrl = document.getElementById('sub-event-tab-url');
        const uploadWrap = document.getElementById('sub-event-upload-wrap');
        const urlWrap = document.getElementById('sub-event-url-wrap');
        const inputFile = document.getElementById('sub-event-file');
        const inputUrl = document.getElementById('sub-event-url');

        function setImageMode(mode) {
            currentImageMode = mode;
            if (mode === 'upload') {
                if (tabUpload) {
                    tabUpload.style.background = 'rgba(0,255,136,0.15)';
                    tabUpload.style.borderColor = '#00ff88';
                    tabUpload.style.color = '#00ff88';
                }
                if (tabUrl) {
                    tabUrl.style.background = 'rgba(255,255,255,0.08)';
                    tabUrl.style.borderColor = 'rgba(255,255,255,0.2)';
                    tabUrl.style.color = '#fff';
                }
                if (uploadWrap) uploadWrap.style.display = 'block';
                if (urlWrap) urlWrap.style.display = 'none';
            } else {
                if (tabUrl) {
                    tabUrl.style.background = 'rgba(0,255,136,0.15)';
                    tabUrl.style.borderColor = '#00ff88';
                    tabUrl.style.color = '#00ff88';
                }
                if (tabUpload) {
                    tabUpload.style.background = 'rgba(255,255,255,0.08)';
                    tabUpload.style.borderColor = 'rgba(255,255,255,0.2)';
                    tabUpload.style.color = '#fff';
                }
                if (uploadWrap) uploadWrap.style.display = 'none';
                if (urlWrap) urlWrap.style.display = 'block';
            }
        }

        if (tabUpload) tabUpload.addEventListener('click', () => setImageMode('upload'));
        if (tabUrl) tabUrl.addEventListener('click', () => setImageMode('url'));

        if (inputFile) {
            inputFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 8 * 1024 * 1024) {
                        alert('Image size exceeds 8MB. Please select a smaller file.');
                        inputFile.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = function (ev) {
                        currentImageBase64 = ev.target.result;
                        showPreview(currentImageBase64);
                    };
                    reader.readAsDataURL(file);
                } else {
                    currentImageBase64 = '';
                    resetPreview();
                }
            });
        }

        if (inputUrl) {
            inputUrl.addEventListener('input', (e) => {
                showPreview(e.target.value.trim());
            });
        }

        // Form Submit
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const token = localStorage.getItem('vortexToken');
                if (!token) {
                    alert('Session expired. Please log in.');
                    window.location.href = '/login.html';
                    return;
                }

                const editId = document.getElementById('sub-event-id').value;
                const isEdit = Boolean(editId);
                const title = document.getElementById('sub-event-title').value.trim();
                const subtitle = document.getElementById('sub-event-subtitle').value.trim();
                const category = document.getElementById('sub-event-category').value.trim() || 'Competition';
                const date = document.getElementById('sub-event-date').value.trim();
                const time = document.getElementById('sub-event-time').value.trim();
                const venue = document.getElementById('sub-event-venue').value.trim() || 'KMCT IETM';
                const fee = document.getElementById('sub-event-fee').value.trim() || 'Free';
                const prize = document.getElementById('sub-event-prize').value.trim();
                const slots = document.getElementById('sub-event-slots').value.trim();
                const status = document.getElementById('sub-event-status').value || 'OPEN';
                const order = document.getElementById('sub-event-order').value;
                const about = document.getElementById('sub-event-about').value.trim();
                const rulesRaw = document.getElementById('sub-event-rules').value || '';
                const rulesArray = rulesRaw.split('\n').map(r => r.trim()).filter(Boolean);

                let imageUrl = '';
                if (currentImageMode === 'upload') {
                    imageUrl = currentImageBase64;
                } else {
                    imageUrl = inputUrl ? inputUrl.value.trim() : '';
                }

                if (!imageUrl && !isEdit) {
                    alert('Please upload an image or enter an image URL.');
                    return;
                }

                const submitBtn = document.getElementById('submit-sub-event-btn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

                try {
                    const payload = {
                        title: title,
                        description: subtitle,
                        subtitle: subtitle,
                        category: category,
                        eventType: 'sub_event',
                        parentEvent: currentEvent,
                        date: date,
                        time: time,
                        venue: venue,
                        fee: fee,
                        prize: prize,
                        slots: slots ? Number(slots) : 0,
                        status: status.toUpperCase(),
                        order: order ? Number(order) : 0,
                        about: about,
                        rules: rulesArray
                    };

                    if (imageUrl) {
                        payload.imageUrl = imageUrl;
                    }

                    const url = isEdit ? `/api/admin/events/${editId}` : `/api/admin/events`;
                    const method = isEdit ? 'PUT' : 'POST';

                    const res = await fetch(url, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data.error || 'Failed to save event');
                    }

                    alert(isEdit ? 'Event updated successfully!' : 'Event created successfully!');
                    closeModal();
                    await loadAndRenderSubEvents();

                } catch (err) {
                    console.error('Error saving event:', err);
                    alert('Error: ' + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = isEdit ? '<i class="fas fa-save"></i> Update Event' : '<i class="fas fa-check"></i> Save Event';
                }
            });
        }
    }

    function openSubEventModal(itemToEdit = null) {
        const modal = document.getElementById('vortex-sub-event-modal');
        const form = document.getElementById('vortex-sub-event-form');
        const titleEl = document.getElementById('sub-event-modal-title');
        const editIdInput = document.getElementById('sub-event-id');
        const titleInput = document.getElementById('sub-event-title');
        const subtitleInput = document.getElementById('sub-event-subtitle');
        const parentDisplay = document.getElementById('sub-event-parent-display');
        const categoryInput = document.getElementById('sub-event-category');
        const dateInput = document.getElementById('sub-event-date');
        const timeInput = document.getElementById('sub-event-time');
        const venueInput = document.getElementById('sub-event-venue');
        const feeInput = document.getElementById('sub-event-fee');
        const prizeInput = document.getElementById('sub-event-prize');
        const slotsInput = document.getElementById('sub-event-slots');
        const statusInput = document.getElementById('sub-event-status');
        const orderInput = document.getElementById('sub-event-order');
        const aboutInput = document.getElementById('sub-event-about');
        const rulesInput = document.getElementById('sub-event-rules');
        const inputUrl = document.getElementById('sub-event-url');
        const submitBtn = document.getElementById('submit-sub-event-btn');

        if (!modal || !form) return;

        form.reset();
        currentImageBase64 = '';
        resetPreview();

        if (parentDisplay) {
            parentDisplay.textContent = currentEvent;
        }

        const isEdit = Boolean(itemToEdit);
        editIdInput.value = isEdit ? itemToEdit._id : '';

        if (isEdit) {
            titleEl.innerHTML = `<i class="fas fa-edit"></i> Edit Event under ${escapeHtml(currentEvent)}`;
            titleInput.value = itemToEdit.title || '';
            subtitleInput.value = itemToEdit.subtitle || itemToEdit.description || '';
            categoryInput.value = itemToEdit.category || 'Competition';
            dateInput.value = itemToEdit.date || '';
            timeInput.value = itemToEdit.time || '';
            venueInput.value = itemToEdit.venue || 'KMCT IETM';
            feeInput.value = itemToEdit.fee || 'Free';
            prizeInput.value = itemToEdit.prize || '';
            slotsInput.value = itemToEdit.slots !== undefined && itemToEdit.slots !== null ? itemToEdit.slots : '';
            statusInput.value = (itemToEdit.status || 'OPEN').toUpperCase();
            orderInput.value = itemToEdit.order !== undefined ? itemToEdit.order : 0;
            aboutInput.value = itemToEdit.about || '';
            rulesInput.value = Array.isArray(itemToEdit.rules) ? itemToEdit.rules.join('\n') : (itemToEdit.rules || '');

            if (itemToEdit.imageUrl) {
                currentImageMode = 'url';
                if (inputUrl) inputUrl.value = itemToEdit.imageUrl;
                showPreview(itemToEdit.imageUrl);
            }
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Event';
        } else {
            titleEl.innerHTML = `<i class="fas fa-gamepad"></i> Add Event / Game under ${escapeHtml(currentEvent)}`;
            categoryInput.value = 'Gaming';
            venueInput.value = 'KMCT IETM';
            feeInput.value = 'Free';
            statusInput.value = 'OPEN';
            orderInput.value = 0;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Save Event';
        }

        modal.classList.add('active');
    }

    function showPreview(src) {
        const img = document.getElementById('sub-event-preview-img');
        const placeholder = document.getElementById('sub-event-preview-placeholder');
        if (src && img && placeholder) {
            img.src = src;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            resetPreview();
        }
    }

    function resetPreview() {
        const img = document.getElementById('sub-event-preview-img');
        const placeholder = document.getElementById('sub-event-preview-placeholder');
        if (img && placeholder) {
            img.src = '';
            img.style.display = 'none';
            placeholder.style.display = 'block';
        }
    }

    function parseDateString(dateStr) {
        if (!dateStr) return { month: 'DATE', day: 'TBA' };
        const parts = dateStr.trim().split(/[\s,]+/);
        if (parts.length >= 2) {
            return {
                month: parts[0].substring(0, 3).toUpperCase(),
                day: parts.slice(1).join(' ')
            };
        }
        return { month: 'DATE', day: dateStr };
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', initElevatePage);
})();
