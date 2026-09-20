// ============================================================
// VORTEX - EVENTS PAGE ADMIN SCRIPT
// Handles creating, editing, and deleting main event cards directly on events.html
// ============================================================

(function () {
    let loadedMainEvents = [];
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

    async function initEventsPage() {
        const adminBar = document.getElementById('admin-main-events-bar');
        if (isAdmin && adminBar) {
            adminBar.style.display = 'flex';
        }

        setupModal();

        // 1. Instant Render from Local Cache (0ms perceived load time)
        try {
            const cachedRaw = localStorage.getItem('vortex_cached_events');
            if (cachedRaw) {
                const cachedEvents = JSON.parse(cachedRaw);
                if (Array.isArray(cachedEvents) && cachedEvents.length > 0) {
                    loadedMainEvents = cachedEvents.filter(e => e.eventType === 'main_event' || (!e.parentEvent && (e.category || '').toLowerCase() === 'session'));
                    renderMainEventsGrid();
                }
            }
        } catch (e) {
            console.warn('Cache parse error:', e);
        }

        // 2. Background Revalidation from API
        await loadAndRenderMainEvents();
    }

    async function loadAndRenderMainEvents(forceFresh = false) {
        const grid = document.querySelector('#events .cards-grid');
        if (!grid) return;

        try {
            let allEvents = null;
            if (!forceFresh) {
                allEvents = window._vortexLoadedEvents;
                if (!allEvents && window._vortexFetchPromise) {
                    allEvents = await window._vortexFetchPromise;
                }
            }
            if (!allEvents) {
                const res = await fetch('/api/events?_t=' + Date.now(), { cache: 'no-store' });
                if (res.ok) allEvents = await res.json();
            }
            if (Array.isArray(allEvents)) {
                // Update cache for all pages
                try {
                    localStorage.setItem('vortex_cached_events', JSON.stringify(allEvents));
                } catch (e) {}
                window._vortexLoadedEvents = allEvents;

                // Filter for main events (eventType === 'main_event' or sessions)
                loadedMainEvents = allEvents.filter(e => e.eventType === 'main_event' || (!e.parentEvent && (e.category || '').toLowerCase() === 'session'));
                renderMainEventsGrid();
                return;
            }
        } catch (err) {
            console.warn('Could not fetch events from API, keeping current view:', err);
        }

        // Only render if nothing rendered yet
        if (grid.querySelectorAll('.skeleton-card').length > 0) {
            renderMainEventsGrid();
        }
    }

    function renderMainEventsGrid() {
        const grid = document.querySelector('#events .cards-grid');
        if (!grid) return;

        let displayList = loadedMainEvents;

        if (displayList.length === 0 && !isAdmin) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.7);">
                    <i class="fas fa-calendar-alt" style="font-size: 3rem; color: #00ff88; margin-bottom: 16px; opacity: 0.6;"></i>
                    <h3 style="font-size: 1.5rem; color: #fff; margin-bottom: 8px;">No Sessions Scheduled Yet</h3>
                    <p style="max-width: 450px; margin: 0 auto;">Upcoming sessions and major events will be announced here soon. Check back later!</p>
                </div>
            `;
            return;
        }

        let cardsHtml = displayList.map(evt => {
            const isClosed = (evt.status || 'OPEN').toUpperCase() === 'CLOSED';
            const isLocked = !isAdmin && isClosed;
            const dateParts = parseDateString(evt.date);
            const linkHref = isLocked ? 'javascript:void(0)' : ('elevate.html?event=' + encodeURIComponent(evt.title));
            const clickAttr = isLocked ? 'onclick="alert(\'Registration for this event is closed. New registrations cannot be accepted.\'); return false;"' : '';
            const cardClass = 'card event-card' + (isLocked ? ' locked-event-card' : '');
            const cardStyle = isLocked ? 'text-decoration: none; color: inherit; cursor: not-allowed; position: relative; opacity: 0.75;' : 'text-decoration: none; color: inherit; cursor: pointer; position: relative;';

            let statusBadge = isClosed 
                ? (isAdmin ? '<div class="card-status status-active" style="background: rgba(255, 170, 0, 0.2); color: #ffaa00; border-color: rgba(255,170,0,0.5);">● CLOSED (ADMIN OPEN)</div>' : '<div class="card-status status-soon">REGISTRATION CLOSED</div>')
                : '<div class="card-status status-active">&#9679; REGISTRATION OPEN</div>';

            const eventId = evt._id || evt.title;
            const adminToolbar = (isAdmin && !evt.isStatic) ? `
                <div class="card-admin-bar">
                    <button type="button" class="card-admin-btn edit" data-id="${eventId}" title="Edit this event card">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button type="button" class="card-admin-btn delete" data-id="${eventId}" data-title="${escapeHtml(evt.title)}" title="Delete this event card">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : '';

            return `
            <a href="${linkHref}" ${clickAttr} class="${cardClass}" style="${cardStyle}">
                ${adminToolbar}
                ${statusBadge}
                <div class="card-image">
                    <img src="${evt.imageUrl || 'https://via.placeholder.com/400x250?text=Event'}"
                        alt="${escapeHtml(evt.title)}" loading="lazy" width="400" height="250"
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
                            <span class="location">📍 ${escapeHtml(evt.venue || 'KMCT IETM')}</span>
                            <span class="arrow">${isClosed ? '🔒' : '↗'}</span>
                        </div>
                    </div>
                </div>
            </a>
            `;
        }).join('');

        // If admin, add the "+ Create Event Card" interactive placeholder slot in grid
        if (isAdmin) {
            cardsHtml += `
            <div class="card event-card card-add-placeholder" id="add-main-event-card-slot" style="cursor: pointer;">
                <div class="add-card-inner">
                    <div class="add-card-icon-wrap">
                        <i class="fas fa-plus"></i>
                    </div>
                    <h3>CREATE EVENT CARD</h3>
                    <p>Add a new session or major event series to the showcase</p>
                    <span class="add-card-badge">+ NEW EVENT CARD</span>
                </div>
            </div>
            `;
        }

        grid.innerHTML = cardsHtml;
        attachCardListeners();
    }

    function attachCardListeners() {
        // "+ Create Event Card" placeholder card
        document.getElementById('add-main-event-card-slot')?.addEventListener('click', () => {
            openMainEventModal();
        });

        // Edit buttons
        document.querySelectorAll('.card-admin-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const item = loadedMainEvents.find(x => x._id === id || x.title === id)
                    || (Array.isArray(window._vortexLoadedEvents) ? window._vortexLoadedEvents.find(x => x._id === id || x.title === id) : null);
                if (item) {
                    openMainEventModal(item);
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.card-admin-btn.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const item = loadedMainEvents.find(x => x._id === id || x.title === id);
                const title = (item && item.title) || btn.getAttribute('data-title') || 'this event card';
                const deleteId = (item && item._id) ? item._id : id;

                if (!confirm(`Are you sure you want to delete the event card "${title}"?\nAll related sub-events will also be removed.`)) {
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
                        throw new Error(data.error || 'Failed to delete event card');
                    }

                    // Immediately remove from local state
                    loadedMainEvents = loadedMainEvents.filter(x => x._id !== id);
                    if (Array.isArray(window._vortexLoadedEvents)) {
                        window._vortexLoadedEvents = window._vortexLoadedEvents.filter(x => x._id !== id);
                        try {
                            localStorage.setItem('vortex_cached_events', JSON.stringify(window._vortexLoadedEvents));
                        } catch (e) {}
                    }
                    renderMainEventsGrid();

                    alert(`Event card "${title}" deleted successfully!`);
                    await loadAndRenderMainEvents(true);
                } catch (err) {
                    console.error('Delete error:', err);
                    alert('Error: ' + err.message);
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-trash"></i>';
                }
            });
        });
    }

    function setupModal() {
        const modal = document.getElementById('vortex-main-event-modal');
        const closeBtn = document.getElementById('close-main-event-modal');
        const cancelBtn = document.getElementById('cancel-main-event-modal');
        const form = document.getElementById('vortex-main-event-form');
        const openBarBtn = document.getElementById('open-create-main-event-btn');

        if (openBarBtn) {
            openBarBtn.addEventListener('click', () => openMainEventModal());
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
        const tabUpload = document.getElementById('main-event-tab-upload');
        const tabUrl = document.getElementById('main-event-tab-url');
        const uploadWrap = document.getElementById('main-event-upload-wrap');
        const urlWrap = document.getElementById('main-event-url-wrap');
        const inputFile = document.getElementById('main-event-file');
        const inputUrl = document.getElementById('main-event-url');

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
                        alert('Image size exceeds 8MB. Please choose a smaller image.');
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

                const editId = document.getElementById('main-event-id').value;
                const isEdit = Boolean(editId);
                const title = document.getElementById('main-event-title').value.trim();
                const subtitle = document.getElementById('main-event-subtitle').value.trim();
                const date = document.getElementById('main-event-date').value.trim();
                const venue = document.getElementById('main-event-venue').value.trim() || 'KMCT IETM';
                const status = document.getElementById('main-event-status').value || 'OPEN';
                const order = document.getElementById('main-event-order').value;
                const about = document.getElementById('main-event-about').value.trim();

                let imageUrl = '';
                if (currentImageBase64 && currentImageBase64.startsWith('data:image')) {
                    imageUrl = currentImageBase64;
                } else if (inputUrl && inputUrl.value.trim()) {
                    imageUrl = inputUrl.value.trim();
                } else {
                    const previewImg = document.getElementById('main-event-preview-img');
                    if (previewImg && previewImg.src && (previewImg.src.startsWith('data:image') || previewImg.src.startsWith('http') || previewImg.src.startsWith('images/'))) {
                        imageUrl = previewImg.src;
                    }
                }

                if (!imageUrl && inputFile && inputFile.files && inputFile.files[0]) {
                    try {
                        imageUrl = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = ev => resolve(ev.target.result);
                            reader.onerror = err => reject(err);
                            reader.readAsDataURL(inputFile.files[0]);
                        });
                        currentImageBase64 = imageUrl;
                    } catch (e) {
                        console.warn('Fallback file read failed in events_admin:', e);
                    }
                }

                if (!imageUrl && !isEdit) {
                    alert('Please select an image file or enter an image URL.');
                    return;
                }

                const submitBtn = document.getElementById('submit-main-event-btn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

                try {
                    const payload = {
                        title: title,
                        description: subtitle,
                        subtitle: subtitle,
                        category: 'Session',
                        eventType: 'main_event',
                        parentEvent: '',
                        date: date,
                        venue: venue,
                        status: status.toUpperCase(),
                        order: order ? Number(order) : 0,
                        about: about
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
                        throw new Error(data.error || 'Failed to save event card');
                    }

                    // Instantly reflect the updated/created event in memory & cache
                    if (data.event) {
                        const savedEvt = data.event;
                        const idx = loadedMainEvents.findIndex(x => x._id === savedEvt._id);
                        if (idx !== -1) {
                            loadedMainEvents[idx] = savedEvt;
                        } else {
                            loadedMainEvents.push(savedEvt);
                        }

                        if (Array.isArray(window._vortexLoadedEvents)) {
                            const vIdx = window._vortexLoadedEvents.findIndex(x => x._id === savedEvt._id);
                            if (vIdx !== -1) {
                                window._vortexLoadedEvents[vIdx] = savedEvt;
                            } else {
                                window._vortexLoadedEvents.push(savedEvt);
                            }
                        } else {
                            window._vortexLoadedEvents = [savedEvt];
                        }

                        try {
                            localStorage.setItem('vortex_cached_events', JSON.stringify(window._vortexLoadedEvents));
                        } catch (e) {}

                        renderMainEventsGrid();
                    }

                    alert(isEdit ? 'Event card updated successfully!' : 'Event card created successfully!');
                    closeModal();
                    await loadAndRenderMainEvents(true);

                } catch (err) {
                    console.error('Error saving event card:', err);
                    alert('Error: ' + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = isEdit ? '<i class="fas fa-save"></i> Update Event Card' : '<i class="fas fa-check"></i> Save Event Card';
                }
            });
        }
    }

    function openMainEventModal(itemToEdit = null) {
        const modal = document.getElementById('vortex-main-event-modal');
        const form = document.getElementById('vortex-main-event-form');
        const titleEl = document.getElementById('main-event-modal-title');
        const editIdInput = document.getElementById('main-event-id');
        const titleInput = document.getElementById('main-event-title');
        const subtitleInput = document.getElementById('main-event-subtitle');
        const dateInput = document.getElementById('main-event-date');
        const venueInput = document.getElementById('main-event-venue');
        const statusInput = document.getElementById('main-event-status');
        const orderInput = document.getElementById('main-event-order');
        const aboutInput = document.getElementById('main-event-about');
        const inputUrl = document.getElementById('main-event-url');
        const submitBtn = document.getElementById('submit-main-event-btn');

        if (!modal || !form) return;

        form.reset();
        currentImageBase64 = '';
        resetPreview();

        const isEdit = Boolean(itemToEdit);
        editIdInput.value = isEdit ? itemToEdit._id : '';

        if (isEdit) {
            titleEl.innerHTML = '<i class="fas fa-edit"></i> Edit Event Card';
            titleInput.value = itemToEdit.title || '';
            subtitleInput.value = itemToEdit.subtitle || itemToEdit.description || '';
            dateInput.value = itemToEdit.date || '';
            venueInput.value = itemToEdit.venue || 'KMCT IETM';
            statusInput.value = (itemToEdit.status || 'OPEN').toUpperCase();
            orderInput.value = itemToEdit.order !== undefined ? itemToEdit.order : 0;
            aboutInput.value = itemToEdit.about || '';

            if (itemToEdit.imageUrl) {
                currentImageMode = 'url';
                if (inputUrl) inputUrl.value = itemToEdit.imageUrl;
                showPreview(itemToEdit.imageUrl);
            }
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Event Card';
        } else {
            titleEl.innerHTML = '<i class="fas fa-calendar-plus"></i> Create Event Card';
            venueInput.value = 'KMCT IETM';
            statusInput.value = 'OPEN';
            orderInput.value = 0;
            setImageMode('upload');
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Save Event Card';
        }

        modal.classList.add('active');
    }

    function showPreview(src) {
        const img = document.getElementById('main-event-preview-img');
        const placeholder = document.getElementById('main-event-preview-placeholder');
        if (src && img && placeholder) {
            img.src = src;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            resetPreview();
        }
    }

    function resetPreview() {
        const img = document.getElementById('main-event-preview-img');
        const placeholder = document.getElementById('main-event-preview-placeholder');
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

    function openMainEventModalById(id) {
        const item = loadedMainEvents.find(x => x._id === id || x.title === id)
            || (Array.isArray(window._vortexLoadedEvents) ? window._vortexLoadedEvents.find(x => x._id === id || x.title === id) : null);
        if (item) {
            openMainEventModal(item);
        } else {
            openMainEventModal();
        }
    }
    window.openMainEventModal = openMainEventModal;
    window.openMainEventModalById = openMainEventModalById;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventsPage);
    } else {
        initEventsPage();
    }
})();
