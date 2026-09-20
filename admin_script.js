let allRegistrations = [];

async function fetchData() {
    const token = localStorage.getItem('vortexToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const res = await fetch('/api/admin/registrations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            const errorText = await res.text();
            console.error("Session Expired (401):", errorText);
            alert("Session expired. Please login again.\nReason: " + errorText);
            localStorage.removeItem('vortexToken');
            localStorage.removeItem('vortexCurrentUser');
            window.location.href = '/login.html';
            return;
        }

        if (res.status === 403) {
            alert("Access Denied: Admin privileges required.");
            window.location.href = '/login.html';
            return;
        }

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Server Error (${res.status}): ${errorText}`);
        }

        allRegistrations = await res.json();
        populateEventFilter(allRegistrations);
        filterAndRender();
    } catch (error) {
        console.error("Fetch Error:", error);
        const tbody = document.getElementById('data-body');
        if (tbody) {
            tbody.innerHTML = `
            <tr>
                <td colspan="8" style="color:red; text-align:center; padding: 20px;">
                    <strong>Error loading data:</strong> ${error.message}<br>
                    <small>Check console for details. Ensure you are logged in as Admin.</small>
                    <button id="retry-btn" class="action-btn" style="margin-top:10px;">Retry</button>
                </td>
            </tr>`;
            // Re-attach retry listener
            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) retryBtn.addEventListener('click', fetchData);
        }
    }
}

function updateKPIs(allData, filteredData) {
    const total = allData.length;
    const paid = allData.filter(item => item.paymentStatus === 'PAID').length;
    const pending = total - paid;
    const certSent = allData.filter(item => (item.certificateStatus || '') === 'Certificate Sent').length;

    const kpiTotal = document.getElementById('kpi-total');
    const kpiPaid = document.getElementById('kpi-paid');
    const kpiPending = document.getElementById('kpi-pending');
    const kpiCert = document.getElementById('kpi-cert');
    const kpiPaidRate = document.getElementById('kpi-paid-rate');
    const kpiCertRate = document.getElementById('kpi-cert-rate');
    const regTabBadge = document.getElementById('tab-badge-registrations');
    const countBadge = document.getElementById('table-count-badge');

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiPaid) kpiPaid.textContent = paid;
    if (kpiPending) kpiPending.textContent = pending;
    if (kpiCert) kpiCert.textContent = certSent;

    const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
    if (kpiPaidRate) kpiPaidRate.innerHTML = `<i class="fas fa-shield-check" style="color: var(--adm-emerald);"></i> ${rate}% conversion rate`;
    if (kpiCertRate) kpiCertRate.innerHTML = `<i class="fas fa-envelope-open-text" style="color: var(--adm-purple);"></i> ${certSent} dispatched`;
    if (regTabBadge) regTabBadge.textContent = total;
    if (countBadge) countBadge.textContent = `Showing ${filteredData.length} of ${total} entries`;
}

function getFilteredRegistrations() {
    const eventFilter = document.getElementById('event-filter')?.value || 'all';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const certFilter = document.getElementById('cert-filter')?.value || 'all';
    const searchVal = document.getElementById('admin-search-input')?.value.toLowerCase().trim() || '';

    let filtered = allRegistrations;

    if (eventFilter !== 'all') {
        filtered = filtered.filter(item => item.event === eventFilter);
    }

    if (statusFilter !== 'all') {
        if (statusFilter === 'PAID') {
            filtered = filtered.filter(item => item.paymentStatus === 'PAID');
        } else {
            filtered = filtered.filter(item => item.paymentStatus !== 'PAID');
        }
    }

    if (certFilter !== 'all') {
        filtered = filtered.filter(item => (item.certificateStatus || 'Pending') === certFilter);
    }

    if (searchVal) {
        filtered = filtered.filter(item => {
            const name = (item.name || '').toLowerCase();
            const email = (item.email || '').toLowerCase();
            const phone = (item.phone || '').toLowerCase();
            const ticketId = (item.ticketId || '').toLowerCase();
            const college = (item.college || '').toLowerCase();
            const eventName = (item.event || '').toLowerCase();
            const dept = (item.department || '').toLowerCase();
            const teammate = (item.teammateName || '').toLowerCase();
            return name.includes(searchVal) ||
                email.includes(searchVal) ||
                phone.includes(searchVal) ||
                ticketId.includes(searchVal) ||
                college.includes(searchVal) ||
                eventName.includes(searchVal) ||
                dept.includes(searchVal) ||
                teammate.includes(searchVal);
        });
    }

    return { filtered, eventFilter, statusFilter, certFilter };
}

function exportExcel() {
    const { filtered, eventFilter, statusFilter, certFilter } = getFilteredRegistrations();

    if (!filtered || filtered.length === 0) {
        alert("No data available to export.");
        return;
    }

    try {
        const headers = ["Ticket ID", "Name", "Event", "Email", "Phone", "Department", "Year", "College", "Date", "Payment Status", "Transaction ID", "Certificate Status", "Certificate ID", "Certificate Issued At", "Teammate Name", "Teammate Phone"];
        const rows = filtered.map(r => [
            r.ticketId || '',
            `"${(r.name || '').replace(/"/g, '""')}"`,
            `"${(r.event || '').replace(/"/g, '""')}"`,
            r.email || '',
            r.phone || '',
            r.department || '',
            r.year || '',
            `"${(r.college || '').replace(/"/g, '""')}"`,
            r.date ? new Date(r.date).toLocaleDateString() : '',
            r.paymentStatus || 'PENDING',
            r.transactionId || r.paymentId || '',
            r.certificateStatus || 'Pending',
            r.certificateId || '',
            r.certificateIssuedAt ? new Date(r.certificateIssuedAt).toLocaleString() : '',
            `"${(r.teammateName || '').replace(/"/g, '""')}"`,
            r.teammatePhone || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Build descriptive filename based on active filters
        const datePart = new Date().toISOString().slice(0, 10);
        const eventPart = eventFilter !== 'all' ? `_${eventFilter.replace(/\s+/g, '_')}` : '_AllEvents';
        const statusPart = statusFilter !== 'all' ? `_${statusFilter}` : '';
        const certPart = certFilter !== 'all' ? `_${certFilter.replace(/\s+/g, '_')}` : '';
        const filename = `vortex${eventPart}${statusPart}${certPart}_${datePart}.csv`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Export error:", error);
        alert("Failed to export data: " + error.message);
    }
}


function populateEventFilter(data) {
    const filter = document.getElementById('event-filter');
    if (!filter) return;
    const currentSelection = filter.value;
    const events = [...new Set(data.map(item => item.event).filter(Boolean))];

    filter.innerHTML = '<option value="all" style="background: #333; color: white;">All Events</option>' +
        events.map(event => `<option value="${event}" style="background: #333; color: white;">${event}</option>`).join('');

    if (events.includes(currentSelection)) {
        filter.value = currentSelection;
    }
}

function filterAndRender() {
    const { filtered } = getFilteredRegistrations();
    updateKPIs(allRegistrations, filtered);
    renderTable(filtered);
    updateBulkButton();
}

function renderTable(data) {
    const tbody = document.getElementById('data-body');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 45px 20px; color: var(--adm-text-dim);">
                    <i class="fas fa-search-minus" style="font-size: 2.2rem; margin-bottom: 12px; display: block; opacity: 0.4;"></i>
                    <p style="font-size: 1rem; color: #fff; margin-bottom: 4px;">No matching registrations found</p>
                    <small>Try clearing your search query or adjusting your active filters.</small>
                </td>
            </tr>
        `;
        updateBulkButton();
        return;
    }

    tbody.innerHTML = data.map(item => {
        const isPaid = item.paymentStatus === 'PAID';
        const certStatus = item.certificateStatus || 'Pending';
        const isCertSent = certStatus === 'Certificate Sent';
        const isCertFailed = certStatus === 'Failed';

        // Initials avatar
        const initials = (item.name || 'U')
            .trim()
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'U';

        let certBadgeHtml = `<span class="cert-badge cert-badge-pending"><i class="fas fa-clock"></i> Pending</span>`;
        if (isCertSent) {
            certBadgeHtml = `
                <span class="cert-badge cert-badge-sent"><i class="fas fa-check-circle"></i> Sent ✅</span>
                <div class="cert-meta-info">${escapeHtml(item.certificateId || '')}</div>
            `;
        } else if (isCertFailed) {
            certBadgeHtml = `
                <span class="cert-badge cert-badge-failed" title="${escapeHtml(item.certificateError || 'Delivery error')}">
                    <i class="fas fa-exclamation-circle"></i> Failed ❌
                </span>
            `;
        }

        const dateStr = item.date ? new Date(item.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : 'N/A';

        return `
        <tr data-ticket-id="${escapeHtml(item.ticketId || '')}">
            <td style="text-align: center;">
                <input type="checkbox" class="cert-checkbox" data-id="${escapeHtml(item.ticketId || '')}">
            </td>
            <td class="table-date-cell">
                <div>${dateStr}</div>
                <div style="font-size: 0.7rem; color: var(--adm-text-dim); font-family: var(--adm-font-mono);">${escapeHtml(item.ticketId || '')}</div>
            </td>
            <td>
                <div class="table-user-cell">
                    <div class="table-user-avatar">${initials}</div>
                    <div>
                        <div class="table-user-name">${escapeHtml(item.name || 'Unknown')}</div>
                        <div class="table-user-email">${escapeHtml(item.email || '')}</div>
                    </div>
                </div>
            </td>
            <td class="table-phone-cell">
                <i class="fas fa-phone-alt" style="font-size: 0.72rem; color: var(--adm-cyan); margin-right: 4px;"></i>
                ${escapeHtml(item.phone || '-')}
            </td>
            <td>
                <span class="table-event-tag">
                    <i class="fas fa-bolt" style="font-size: 0.68rem;"></i> ${escapeHtml(item.event || 'General')}
                </span>
            </td>
            <td>
                <div class="table-details-box">
                    ${item.department ? `<strong>${escapeHtml(item.department)}</strong>` : ''}
                    ${item.year ? ` • Yr ${escapeHtml(item.year)}` : ''}
                    ${item.college ? `<br><span style="color: var(--adm-text-dim);">${escapeHtml(item.college)}</span>` : ''}
                    ${item.teammateName ? `
                        <div class="table-teammate-pill">
                            <i class="fas fa-user-friends"></i> ${escapeHtml(item.teammateName)}${item.teammatePhone ? ' · ' + escapeHtml(item.teammatePhone) : ''}
                        </div>
                    ` : ''}
                </div>
            </td>
            <td>
                <span class="${isPaid ? 'status-paid' : 'status-pending'}">
                    ${isPaid ? 'PAID' : 'PENDING'}
                </span>
            </td>
            <td>
                ${certBadgeHtml}
            </td>
            <td style="text-align: right;">
                <div style="display: inline-flex; flex-direction: column; gap: 5px; align-items: flex-end;">
                    ${!isCertSent ?
                        `<button data-action="approve-cert" data-id="${escapeHtml(item.ticketId)}" class="action-btn cert-btn-approve" title="Review, generate PDF and email certificate">
                            <i class="fas fa-paper-plane"></i> Approve &amp; Send Cert
                        </button>` :
                        `
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end;">
                            <button data-action="resend-cert" data-id="${escapeHtml(item.ticketId)}" class="action-btn cert-btn-resend" title="Resend certificate email">
                                <i class="fas fa-redo-alt"></i> Resend
                            </button>
                            <a href="/api/certificate/download/${escapeHtml(item.ticketId)}" target="_blank" class="action-btn cert-btn-download" title="Download official PDF">
                                <i class="fas fa-file-pdf"></i> PDF
                            </a>
                            <a href="/verify/${escapeHtml(item.certificateId)}" target="_blank" class="action-btn cert-btn-download" title="Verify Online">
                                <i class="fas fa-external-link-alt"></i> Verify
                            </a>
                        </div>
                        `
                    }

                    <div style="display: flex; gap: 4px; justify-content: flex-end;">
                        ${!isPaid ?
                            `<button data-action="approve" data-id="${escapeHtml(item.ticketId)}" class="action-btn" style="background: rgba(0, 255, 136, 0.15); color: #00ff88; border: 1px solid rgba(0, 255, 136, 0.3); font-size: 0.72rem; padding: 4px 8px;">
                                <i class="fas fa-check"></i> Pay OK
                            </button>` :
                            ''
                        }
                        <button data-action="delete" data-id="${escapeHtml(item.ticketId || item._id)}" class="action-btn delete-btn" title="Remove registration">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    `}).join('');

    attachCheckboxListeners();
    updateBulkButton();
}

async function verifyPayment(ticketId, action) {
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} this payment?`)) return;

    const token = localStorage.getItem('vortexToken');
    try {
        const res = await fetch('/api/admin/verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ticketId, action })
        });

        const data = await res.json();
        if (res.ok) {
            alert("Success: " + data.message);
            fetchData();
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error(error);
        alert("Failed to verify payment.");
    }
}

async function deleteRegistration(identifier) {
    console.log("Attempting to delete:", identifier);
    if (!confirm(`Are you sure you want to delete registration?`)) return;

    const token = localStorage.getItem('vortexToken');
    try {
        const res = await fetch(`/api/admin/registration/${identifier}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Registration deleted.");
            fetchData();
        } else {
            const data = await res.json();
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error(error);
        alert("Failed to delete.");
    }
}

async function deleteAllRegistrations() {
    if (!confirm("WARNING: You are about to DELETE ALL registrations. This action cannot be undone.")) return;
    if (!confirm("Are you ABSOLUTELY SURE? This will wipe the entire database.")) return;

    const token = localStorage.getItem('vortexToken');
    try {
        const res = await fetch('/api/admin/registrations', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            alert(data.message);
            fetchData();
        } else {
            const data = await res.json();
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error("Delete All Error:", error);
        alert("Failed to delete all registrations.");
    }
}

// --- Certificate Actions ---

async function approveCertificate(ticketId, forceResend = false, buttonEl = null) {
    const actionLabel = forceResend ? "RESEND" : "APPROVE & SEND";
    if (!confirm(`Are you sure you want to ${actionLabel} the certificate for student ticket: ${ticketId}?`)) return;

    let originalHtml = '';
    if (buttonEl) {
        originalHtml = buttonEl.innerHTML;
        buttonEl.disabled = true;
        buttonEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    const token = localStorage.getItem('vortexToken');
    try {
        const res = await fetch('/api/admin/approve-certificate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ticketId, forceResend })
        });

        const data = await res.json();
        if (res.ok) {
            alert("Success: " + data.message);
            fetchData();
        } else {
            alert("Error: " + (data.error || "Failed to issue certificate."));
            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.innerHTML = originalHtml;
            }
        }
    } catch (error) {
        console.error("Certificate approval error:", error);
        alert("Failed to communicate with certificate service.");
        if (buttonEl) {
            buttonEl.disabled = false;
            buttonEl.innerHTML = originalHtml;
        }
    }
}

function attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.cert-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const tr = cb.closest('tr');
            if (tr) {
                if (cb.checked) tr.classList.add('row-selected');
                else tr.classList.remove('row-selected');
            }
            updateBulkButton();
        });
    });

    const selectAll = document.getElementById('select-all-certs');
    if (selectAll) {
        selectAll.onclick = () => {
            checkboxes.forEach(cb => {
                cb.checked = selectAll.checked;
                const tr = cb.closest('tr');
                if (tr) {
                    if (cb.checked) tr.classList.add('row-selected');
                    else tr.classList.remove('row-selected');
                }
            });
            updateBulkButton();
        };
    }
}

function updateBulkButton() {
    const allCbs = document.querySelectorAll('.cert-checkbox');
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    const bulkBtn = document.getElementById('bulk-cert-btn');
    const countSpan = document.getElementById('selected-count');
    const selectAll = document.getElementById('select-all-certs');

    allCbs.forEach(cb => {
        const tr = cb.closest('tr');
        if (tr) {
            if (cb.checked) tr.classList.add('row-selected');
            else tr.classList.remove('row-selected');
        }
    });

    if (selectAll && allCbs.length > 0) {
        selectAll.checked = (checked.length === allCbs.length);
        selectAll.indeterminate = (checked.length > 0 && checked.length < allCbs.length);
    }

    if (!bulkBtn || !countSpan) return;

    countSpan.textContent = checked.length;
    if (checked.length > 0) {
        bulkBtn.style.display = 'inline-block';
    } else {
        bulkBtn.style.display = 'none';
    }
}

function selectPendingStudents() {
    const rows = document.querySelectorAll('#data-body tr[data-ticket-id]');
    let count = 0;

    rows.forEach(tr => {
        const ticketId = tr.getAttribute('data-ticket-id');
        const reg = allRegistrations.find(r => r.ticketId === ticketId);
        const cb = tr.querySelector('.cert-checkbox');
        if (cb && reg && reg.certificateStatus !== 'Certificate Sent') {
            cb.checked = true;
            tr.classList.add('row-selected');
            count++;
        } else if (cb) {
            cb.checked = false;
            tr.classList.remove('row-selected');
        }
    });

    updateBulkButton();

    if (count === 0) {
        alert("All participants in the current view have already received their certificates.");
    }
}

async function sendAllCertificates() {
    const { filtered } = getFilteredRegistrations();
    const eventFilter = document.getElementById('event-filter')?.value || 'all';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';

    const pendingTotal = allRegistrations.filter(r => r.certificateStatus !== 'Certificate Sent');
    const pendingFiltered = filtered.filter(r => r.certificateStatus !== 'Certificate Sent');

    let targetTicketIds = null;

    if (eventFilter !== 'all' || statusFilter !== 'all') {
        const useFiltered = confirm(
            `Active filter detected (${eventFilter !== 'all' ? `Event: ${eventFilter} ` : ''}${statusFilter !== 'all' ? `Status: ${statusFilter}` : ''}).\n\n` +
            `• Click OK to send certificates to ${pendingFiltered.length} matching pending student(s).\n` +
            `• Click CANCEL to send to ALL ${pendingTotal.length} pending students across all events.`
        );

        if (useFiltered) {
            targetTicketIds = pendingFiltered.map(r => r.ticketId).filter(Boolean);
            if (targetTicketIds.length === 0) {
                alert("No students with pending certificates found in this filtered view.");
                return;
            }
        }
    }

    let payload = {};
    if (targetTicketIds) {
        payload = { ticketIds: targetTicketIds, forceResend: false };
    } else {
        if (pendingTotal.length === 0) {
            const force = confirm("All participants have already been issued certificates. Would you like to force resend to ALL participants?");
            if (!force) return;
            payload = { sendAll: true, forceResend: true };
        } else {
            const proceed = confirm(`Are you sure you want to generate & deliver certificates to all ${pendingTotal.length} participant(s) with pending certificates?`);
            if (!proceed) return;
            payload = { sendAll: true, forceResend: false };
        }
    }

    const sendBtn = document.getElementById('send-all-certs-btn');
    const originalHtml = sendBtn ? sendBtn.innerHTML : '';
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Delivering to Everyone...';
    }

    const token = localStorage.getItem('vortexToken');
    try {
        const res = await fetch('/api/admin/send-all-certificates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            const summary = data.summary || {};
            alert(`🎉 Batch Certificate Delivery Complete!\n\n` +
                  `• Total Processed: ${summary.total ?? '0'}\n` +
                  `• Successfully Sent: ${summary.successCount ?? '0'}\n` +
                  `• Already Sent (Skipped): ${summary.skippedCount ?? '0'}\n` +
                  `• Failed Deliveries: ${summary.failedCount ?? '0'}`);
            fetchData();
        } else {
            alert("Delivery Error: " + (data.error || "Server error occurred"));
        }
    } catch (err) {
        console.error("Send all certificates error:", err);
        alert("Failed to communicate with certificate delivery service: " + err.message);
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalHtml;
        }
    }
}

async function bulkApproveCertificates() {
    const checked = Array.from(document.querySelectorAll('.cert-checkbox:checked'));
    if (checked.length === 0) return;

    const ticketIds = checked.map(cb => cb.getAttribute('data-id')).filter(Boolean);
    if (!confirm(`Are you sure you want to send certificates to ${ticketIds.length} selected participant(s)?`)) return;

    const bulkBtn = document.getElementById('bulk-cert-btn');
    const originalHtml = bulkBtn ? bulkBtn.innerHTML : '';
    if (bulkBtn) {
        bulkBtn.disabled = true;
        bulkBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Delivering to ${ticketIds.length} Selected...`;
    }

    const token = localStorage.getItem('vortexToken');
    try {
        const res = await fetch('/api/admin/bulk-approve-certificates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ticketIds, forceResend: false })
        });

        const data = await res.json();
        if (res.ok) {
            const summary = data.summary || {};
            alert(`🎉 Delivery to Selected Participants Complete!\n\n` +
                  `• Total Selected: ${summary.total ?? ticketIds.length}\n` +
                  `• Successfully Sent: ${summary.successCount ?? 0}\n` +
                  `• Already Sent (Skipped): ${summary.skippedCount ?? 0}\n` +
                  `• Failed: ${summary.failedCount ?? 0}`);
            fetchData();
        } else {
            alert("Bulk delivery error: " + (data.error || "Server error"));
        }
    } catch (err) {
        console.error("Bulk approve error:", err);
        alert("Failed to execute bulk delivery: " + err.message);
    } finally {
        if (bulkBtn) {
            bulkBtn.disabled = false;
            bulkBtn.innerHTML = originalHtml;
            updateBulkButton();
        }
    }
}

function logout() {
    localStorage.removeItem('vortexToken');
    localStorage.removeItem('vortexCurrentUser');
    window.location.href = '/index.html';
}

// Event Listeners (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    // Initial Fetch of all sections
    fetchData();
    fetchLeads();
    fetchNetwork();
    fetchGallery();

    // Quick Search Listeners
    const searchInput = document.getElementById('admin-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
            }
            filterAndRender();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            clearSearchBtn.style.display = 'none';
            filterAndRender();
        });
    }

    // Mobile Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const adminSidebar = document.getElementById('admin-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (sidebarToggleBtn && adminSidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            adminSidebar.classList.toggle('open');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay && adminSidebar) {
        sidebarOverlay.addEventListener('click', () => {
            adminSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Button Listeners
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        const originalHtml = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        fetchData().finally(() => {
            refreshBtn.innerHTML = originalHtml;
        });
    });

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportExcel);

    const sendAllCertsBtn = document.getElementById('send-all-certs-btn');
    if (sendAllCertsBtn) sendAllCertsBtn.addEventListener('click', sendAllCertificates);

    const bulkCertBtn = document.getElementById('bulk-cert-btn');
    if (bulkCertBtn) bulkCertBtn.addEventListener('click', bulkApproveCertificates);

    const selectPendingBtn = document.getElementById('select-pending-btn');
    if (selectPendingBtn) selectPendingBtn.addEventListener('click', selectPendingStudents);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    const deleteAllBtn = document.getElementById('delete-all-btn');
    if (deleteAllBtn) deleteAllBtn.addEventListener('click', deleteAllRegistrations);

    // Filters
    const evFilt = document.getElementById('event-filter');
    if (evFilt) evFilt.addEventListener('change', filterAndRender);

    const stFilt = document.getElementById('status-filter');
    if (stFilt) stFilt.addEventListener('change', filterAndRender);

    const certFilt = document.getElementById('cert-filter');
    if (certFilt) certFilt.addEventListener('change', filterAndRender);

    // Event Delegation for Table Actions
    const dataBody = document.getElementById('data-body');
    if (dataBody) {
        dataBody.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const id = target.getAttribute('data-id');

            if (action === 'approve') {
                verifyPayment(id, 'approve');
            } else if (action === 'delete') {
                deleteRegistration(id);
            } else if (action === 'approve-cert') {
                approveCertificate(id, false, target);
            } else if (action === 'resend-cert') {
                approveCertificate(id, true, target);
            }
        });
    }

    // Initialize CMS Management Tabs & Modals
    initAdminCMS();
});

// ============================================================
// --- Admin CMS Functionality (Leads, Network, Gallery) ---
// ============================================================

let currentImageBase64 = '';
let currentImageMode = 'upload'; // 'upload' or 'url'
let loadedLeads = [];
let loadedNetwork = [];
let loadedGallery = [];
let loadedEvents = [];

function initAdminCMS() {
    // 1. Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
            const targetSec = document.getElementById(`section-${targetTab}`);
            if (targetSec) targetSec.classList.add('active');

            // Auto-close sidebar on mobile after tab select
            const sidebar = document.getElementById('admin-sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (window.innerWidth <= 992 && sidebar) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            }

            // Load data for selected tab
            if (targetTab === 'events') fetchEvents();
            else if (targetTab === 'leads') fetchLeads();
            else if (targetTab === 'network') fetchNetwork();
            else if (targetTab === 'gallery') fetchGallery();
            else if (targetTab === 'registrations') fetchData();
        });
    });

    // 2. Modal Setup
    const modal = document.getElementById('cms-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const cmsForm = document.getElementById('cms-form');

    function openModal(type, itemToEdit = null) {
        document.getElementById('cms-type').value = type;
        document.getElementById('cms-id').value = itemToEdit ? itemToEdit._id : '';
        const titleEl = document.getElementById('modal-title');
        const labelName = document.getElementById('label-name-title');
        const inputName = document.getElementById('input-name-title');
        const groupRole = document.getElementById('group-role');
        const labelRole = document.getElementById('label-role');
        const inputRole = document.getElementById('input-role');
        const inputOrder = document.getElementById('input-order');
        const submitBtn = document.getElementById('submit-cms-btn');
        const eventExtraFields = document.getElementById('event-extra-fields');

        // Reset form
        cmsForm.reset();
        currentImageBase64 = '';
        resetImagePreview();

        const isEdit = Boolean(itemToEdit);

        if (type === 'events') {
            if (eventExtraFields) eventExtraFields.style.display = 'block';
            groupRole.style.display = 'block';
            labelRole.textContent = 'Subtitle / Tagline (Optional)';
            inputRole.placeholder = 'e.g. Inter-College Flagship Tech Fest';
            inputRole.required = false;

            const catInput = document.getElementById('input-event-category');
            const statusInput = document.getElementById('input-event-status');
            const typeInput = document.getElementById('input-event-type');
            const parentInput = document.getElementById('input-parent-event');
            const groupParent = document.getElementById('group-parent-event');
            const dateInput = document.getElementById('input-event-date');
            const timeInput = document.getElementById('input-event-time');
            const venueInput = document.getElementById('input-event-venue');
            const feeInput = document.getElementById('input-event-fee');
            const prizeInput = document.getElementById('input-event-prize');
            const slotsInput = document.getElementById('input-event-slots');
            const aboutInput = document.getElementById('input-event-about');
            const rulesInput = document.getElementById('input-event-rules');

            const isMain = isEdit
                ? (itemToEdit.eventType === 'main_event' || (!itemToEdit.parentEvent && (itemToEdit.category || '').toLowerCase() === 'session'))
                : false;

            if (isMain) {
                titleEl.textContent = isEdit ? 'Edit Event Details' : 'Create New Event';
                labelName.textContent = 'Event Name';
                inputName.placeholder = 'e.g. ELEVATE';
                if (groupParent) groupParent.style.display = 'none';
            } else {
                titleEl.textContent = isEdit ? 'Edit Game / Competition' : 'Add Game / Competition';
                labelName.textContent = 'Game / Competition Name';
                inputName.placeholder = 'e.g. BGMI, Tech Hunt, Web-Designing';
                if (groupParent) groupParent.style.display = 'block';
            }

            inputName.required = true;

            if (isEdit) {
                if (typeInput) typeInput.value = isMain ? 'main_event' : 'sub_event';
                if (parentInput) parentInput.value = itemToEdit.parentEvent || (isMain ? '' : 'ELEVATE');
                if (catInput) catInput.value = itemToEdit.category || (isMain ? 'Fest' : 'Competition');
                if (statusInput) statusInput.value = (itemToEdit.status || 'OPEN').toUpperCase();
                if (dateInput) dateInput.value = itemToEdit.date || '';
                if (timeInput) timeInput.value = itemToEdit.time || '';
                if (venueInput) venueInput.value = itemToEdit.venue || '';
                if (feeInput) feeInput.value = itemToEdit.fee || 'Free';
                if (prizeInput) prizeInput.value = itemToEdit.prize || '';
                if (slotsInput) slotsInput.value = itemToEdit.slots || '';
                if (aboutInput) aboutInput.value = itemToEdit.about || '';
                if (rulesInput) rulesInput.value = Array.isArray(itemToEdit.rules) ? itemToEdit.rules.join('\n') : '';
            } else {
                if (typeInput) typeInput.value = 'sub_event';
                if (parentInput) parentInput.value = 'ELEVATE';
                if (catInput) catInput.value = 'Competition';
                if (statusInput) statusInput.value = 'OPEN';
            }
        } else {
            if (eventExtraFields) eventExtraFields.style.display = 'none';

            if (type === 'leads') {
                titleEl.textContent = isEdit ? 'Edit Faculty / Lead Member' : 'Add Faculty / Lead Member';
                labelName.textContent = 'Full Name';
                inputName.placeholder = 'e.g. Dr. John Doe';
                inputName.required = true;
                groupRole.style.display = 'block';
                labelRole.textContent = 'Role / Designation';
                inputRole.placeholder = 'e.g. ASSISTANT PROFESSOR';
                inputRole.required = true;
            } else if (type === 'network') {
                titleEl.textContent = isEdit ? 'Edit Operative Team Member' : 'Add Operative Team Member';
                labelName.textContent = 'Full Name';
                inputName.placeholder = 'e.g. Jane Smith';
                inputName.required = true;
                groupRole.style.display = 'block';
                labelRole.textContent = 'Role';
                inputRole.placeholder = 'e.g. Web Developer / Coordinator';
                inputRole.required = true;
            } else if (type === 'gallery') {
                titleEl.textContent = isEdit ? 'Edit Gallery Moment' : 'Add Gallery Moment';
                labelName.textContent = 'Title / Caption (Optional)';
                inputName.placeholder = 'e.g. Hackathon Kickoff';
                inputName.required = false;
                groupRole.style.display = 'block';
                labelRole.textContent = 'Description (Optional)';
                inputRole.placeholder = 'Short description...';
                inputRole.required = false;
            }
        }

        if (isEdit) {
            inputName.value = itemToEdit.title || itemToEdit.name || '';
            inputRole.value = itemToEdit.subtitle || itemToEdit.role || itemToEdit.description || '';
            inputOrder.value = itemToEdit.order !== undefined ? itemToEdit.order : 0;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Changes';

            if (itemToEdit.imageUrl) {
                setImageMode('url');
                inputUrl.value = itemToEdit.imageUrl;
                showImagePreview(itemToEdit.imageUrl);
            } else {
                setImageMode('upload');
            }
        } else {
            inputOrder.value = 0;
            setImageMode('upload');
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Save to Website';
        }

        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.getElementById('open-add-event-btn')?.addEventListener('click', () => openModal('events'));
    document.getElementById('open-add-lead-btn')?.addEventListener('click', () => openModal('leads'));
    document.getElementById('open-add-network-btn')?.addEventListener('click', () => openModal('network'));
    document.getElementById('open-add-gallery-btn')?.addEventListener('click', () => openModal('gallery'));

    document.getElementById('input-event-type')?.addEventListener('change', (e) => {
        const groupParent = document.getElementById('group-parent-event');
        const titleEl = document.getElementById('modal-title');
        const labelName = document.getElementById('label-name-title');
        const inputName = document.getElementById('input-name-title');
        const editId = document.getElementById('cms-id')?.value;
        const isEdit = Boolean(editId);

        if (e.target.value === 'main_event') {
            if (groupParent) groupParent.style.display = 'none';
            if (titleEl) titleEl.textContent = isEdit ? 'Edit Event Details' : 'Create New Event';
            if (labelName) labelName.textContent = 'Event Name';
            if (inputName) inputName.placeholder = 'e.g. ELEVATE';
        } else {
            if (groupParent) groupParent.style.display = 'block';
            if (titleEl) titleEl.textContent = isEdit ? 'Edit Game / Competition' : 'Add Game / Competition';
            if (labelName) labelName.textContent = 'Game / Competition Name';
            if (inputName) inputName.placeholder = 'e.g. BGMI, Tech Hunt, Web-Designing';
        }
    });

    document.getElementById('event-placement-filter')?.addEventListener('change', () => {
        renderEventsGrid();
    });

    // 3. Image mode toggles
    const tabUpload = document.getElementById('tab-upload');
    const tabUrl = document.getElementById('tab-url');
    const uploadMode = document.getElementById('image-upload-mode');
    const urlMode = document.getElementById('image-url-mode');
    const inputFile = document.getElementById('input-file');
    const inputUrl = document.getElementById('input-url');

    function setImageMode(mode) {
        currentImageMode = mode;
        if (mode === 'upload') {
            tabUpload.classList.add('active');
            tabUrl.classList.remove('active');
            uploadMode.style.display = 'block';
            urlMode.style.display = 'none';
        } else {
            tabUrl.classList.add('active');
            tabUpload.classList.remove('active');
            urlMode.style.display = 'block';
            uploadMode.style.display = 'none';
        }
    }

    tabUpload.addEventListener('click', () => setImageMode('upload'));
    tabUrl.addEventListener('click', () => setImageMode('url'));

    function resetImagePreview() {
        const preview = document.getElementById('image-preview');
        const placeholder = document.getElementById('preview-placeholder');
        preview.src = '';
        preview.style.display = 'none';
        placeholder.style.display = 'block';
    }

    function showImagePreview(src) {
        const preview = document.getElementById('image-preview');
        const placeholder = document.getElementById('preview-placeholder');
        if (src) {
            preview.src = src;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            resetImagePreview();
        }
    }

    function compressImageFile(file, maxWidth = 1600, quality = 0.82) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let w = img.width;
                    let h = img.height;
                    if (w > maxWidth || h > maxWidth) {
                        if (w > h) {
                            h = Math.round((h * maxWidth) / w);
                            w = maxWidth;
                        } else {
                            w = Math.round((w * maxWidth) / h);
                            h = maxWidth;
                        }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // File input preview
    inputFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 15 * 1024 * 1024) {
                alert('File size too large. Please select an image under 15MB.');
                inputFile.value = '';
                return;
            }
            try {
                // Instantly compress client-side for lightning-fast loading
                currentImageBase64 = await compressImageFile(file);
                showImagePreview(currentImageBase64);
            } catch (err) {
                console.error("Compression error:", err);
                const reader = new FileReader();
                reader.onload = function (event) {
                    currentImageBase64 = event.target.result;
                    showImagePreview(currentImageBase64);
                };
                reader.readAsDataURL(file);
            }
        } else {
            currentImageBase64 = '';
            resetImagePreview();
        }
    });

    // URL input preview
    inputUrl.addEventListener('input', (e) => {
        showImagePreview(e.target.value.trim());
    });

    // 4. Form Submission (Create or Update)
    cmsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('cms-type').value;
        const editId = document.getElementById('cms-id').value;
        const isEdit = Boolean(editId);

        const token = localStorage.getItem('vortexToken');
        if (!token) {
            alert('Session expired. Please log in.');
            window.location.href = '/login.html';
            return;
        }

        const nameOrTitle = document.getElementById('input-name-title').value.trim();
        const roleOrDesc = document.getElementById('input-role').value.trim();
        const orderVal = document.getElementById('input-order').value;

        let imageUrl = '';
        if (currentImageBase64 && currentImageBase64.startsWith('data:image')) {
            imageUrl = currentImageBase64;
        } else if (inputUrl && inputUrl.value && inputUrl.value.trim()) {
            imageUrl = inputUrl.value.trim();
        } else {
            const previewImg = document.getElementById('preview-img');
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
                console.warn('Fallback file read failed in admin_script:', e);
            }
        }

        if (!imageUrl && !isEdit) {
            alert('Please select an image file or enter an image URL.');
            return;
        }

        const submitBtn = document.getElementById('submit-cms-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            let payload = {};
            if (type === 'events') {
                const rulesRaw = document.getElementById('input-event-rules')?.value || '';
                const rulesArray = rulesRaw.split('\n').map(r => r.trim()).filter(r => r.length > 0);
                const eventPlacement = document.getElementById('input-event-type')?.value || 'sub_event';
                const parentFest = eventPlacement === 'main_event' ? '' : (document.getElementById('input-parent-event')?.value.trim() || 'ELEVATE');

                payload = {
                    title: nameOrTitle,
                    subtitle: roleOrDesc,
                    category: document.getElementById('input-event-category')?.value.trim() || 'General',
                    eventType: eventPlacement,
                    parentEvent: parentFest,
                    status: (document.getElementById('input-event-status')?.value || 'OPEN').toUpperCase(),
                    date: document.getElementById('input-event-date')?.value.trim() || '',
                    time: document.getElementById('input-event-time')?.value.trim() || '',
                    venue: document.getElementById('input-event-venue')?.value.trim() || '',
                    fee: document.getElementById('input-event-fee')?.value.trim() || 'Free',
                    prize: document.getElementById('input-event-prize')?.value.trim() || '',
                    slots: (() => {
                        const val = document.getElementById('input-event-slots')?.value.trim() || '';
                        return parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 0;
                    })(),
                    about: document.getElementById('input-event-about')?.value.trim() || '',
                    rules: rulesArray,
                    order: orderVal ? Number(orderVal) : 0
                };
            } else if (type === 'leads' || type === 'network') {
                payload = {
                    name: nameOrTitle,
                    role: roleOrDesc,
                    order: orderVal ? Number(orderVal) : 0
                };
            } else if (type === 'gallery') {
                payload = {
                    title: nameOrTitle,
                    description: roleOrDesc,
                    order: orderVal ? Number(orderVal) : 0
                };
            }

            if (imageUrl) {
                payload.imageUrl = imageUrl;
            }

            const url = isEdit ? `/api/admin/${type}/${editId}` : `/api/admin/${type}`;
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
                throw new Error(data.error || 'Failed to save item');
            }

            alert(isEdit ? 'Updated successfully!' : 'Added successfully!');
            closeModal();

            if (type === 'events') fetchEvents();
            else if (type === 'leads') fetchLeads();
            else if (type === 'network') fetchNetwork();
            else if (type === 'gallery') fetchGallery();

        } catch (err) {
            console.error('Error saving item:', err);
            alert('Error: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isEdit ? '<i class="fas fa-save"></i> Update Changes' : '<i class="fas fa-check"></i> Save to Website';
        }
    });

    // 5. Edit and Delete Delegation
    document.addEventListener('click', async (e) => {
        // Edit Action
        const editBtn = e.target.closest('.card-edit-btn');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const type = editBtn.getAttribute('data-type');
            let item = null;
            if (type === 'events') item = loadedEvents.find(x => x._id === id);
            else if (type === 'leads') item = loadedLeads.find(x => x._id === id);
            else if (type === 'network') item = loadedNetwork.find(x => x._id === id);
            else if (type === 'gallery') item = loadedGallery.find(x => x._id === id);

            if (item) {
                openModal(type, item);
            }
            return;
        }

        // Delete Action
        const delBtn = e.target.closest('.card-delete-btn');
        if (!delBtn) return;

        const id = delBtn.getAttribute('data-id');
        const type = delBtn.getAttribute('data-type');
        const name = delBtn.getAttribute('data-name') || 'this item';

        if (!confirm(`Are you sure you want to remove "${name}" from the website?`)) {
            return;
        }

        const token = localStorage.getItem('vortexToken');
        if (!token) {
            alert('Session expired. Please log in.');
            return;
        }

        try {
            delBtn.disabled = true;
            delBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const res = await fetch(`/api/admin/${type}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete');

            // Refresh view
            if (type === 'events') fetchEvents();
            else if (type === 'leads') fetchLeads();
            else if (type === 'network') fetchNetwork();
            else if (type === 'gallery') fetchGallery();

        } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting item: ' + err.message);
            delBtn.disabled = false;
            delBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
        }
    });
}

// Fetch and Render Leads
async function fetchLeads() {
    const grid = document.getElementById('leads-grid');
    const countBadge = document.getElementById('leads-count');
    const tabBadge = document.getElementById('tab-badge-leads');
    try {
        const res = await fetch('/api/leads?_t=' + Date.now(), { cache: 'no-store' });
        const leads = await res.json();
        loadedLeads = Array.isArray(leads) ? leads : [];
        try { localStorage.setItem('vortex_cached_leads', JSON.stringify(loadedLeads)); } catch(e){}
        if (countBadge) countBadge.textContent = `${loadedLeads.length} items`;
        if (tabBadge) tabBadge.textContent = loadedLeads.length;

        if (!grid) return;
        if (!loadedLeads || loadedLeads.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-user-slash"></i><p>No faculty/lead members found. Click "+ Add Lead Member" to add one!</p></div>';
            return;
        }

        grid.innerHTML = loadedLeads.map(lead => `
            <div class="admin-card">
                <div class="card-thumb-container">
                    <img src="${lead.imageUrl}" alt="${escapeHtml(lead.name)}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image';">
                </div>
                <div class="card-body">
                    <div>
                        <h3>${escapeHtml(lead.name)}</h3>
                        <div class="card-subtitle">${escapeHtml(lead.role || '')}</div>
                    </div>
                    <div class="card-actions">
                        <button class="card-edit-btn" data-type="leads" data-id="${lead._id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="card-delete-btn" data-type="leads" data-id="${lead._id}" data-name="${escapeHtml(lead.name)}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error fetching leads:', err);
        if (grid) grid.innerHTML = `<div class="empty-state" style="color:red;"><p>Error loading leads: ${err.message}</p></div>`;
    }
}

// Fetch and Render Operative Network
async function fetchNetwork() {
    const grid = document.getElementById('network-grid');
    const countBadge = document.getElementById('network-count');
    const tabBadge = document.getElementById('tab-badge-network');
    try {
        const res = await fetch('/api/network?_t=' + Date.now(), { cache: 'no-store' });
        const members = await res.json();
        loadedNetwork = Array.isArray(members) ? members : [];
        try { localStorage.setItem('vortex_cached_network', JSON.stringify(loadedNetwork)); } catch(e){}
        if (countBadge) countBadge.textContent = `${loadedNetwork.length} items`;
        if (tabBadge) tabBadge.textContent = loadedNetwork.length;

        if (!grid) return;
        if (!loadedNetwork || loadedNetwork.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-users-slash"></i><p>No team members found. Click "+ Add Team Member" to add one!</p></div>';
            return;
        }

        grid.innerHTML = loadedNetwork.map(m => `
            <div class="admin-card">
                <div class="card-thumb-container">
                    <img src="${m.imageUrl}" alt="${escapeHtml(m.name)}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image';">
                </div>
                <div class="card-body">
                    <div>
                        <h3>${escapeHtml(m.name)}</h3>
                        <div class="card-subtitle">${escapeHtml(m.role || '')}</div>
                    </div>
                    <div class="card-actions">
                        <button class="card-edit-btn" data-type="network" data-id="${m._id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="card-delete-btn" data-type="network" data-id="${m._id}" data-name="${escapeHtml(m.name)}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error fetching network:', err);
        if (grid) grid.innerHTML = `<div class="empty-state" style="color:red;"><p>Error loading network: ${err.message}</p></div>`;
    }
}

// Fetch and Render Gallery Items
async function fetchGallery() {
    const grid = document.getElementById('gallery-grid');
    const countBadge = document.getElementById('gallery-count');
    const tabBadge = document.getElementById('tab-badge-gallery');
    try {
        const res = await fetch('/api/gallery');
        const items = await res.json();
        loadedGallery = Array.isArray(items) ? items : [];
        if (countBadge) countBadge.textContent = `${loadedGallery.length} items`;
        if (tabBadge) tabBadge.textContent = loadedGallery.length;

        if (!grid) return;
        if (!loadedGallery || loadedGallery.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>No gallery images found. Click "+ Add Gallery Image" to add one!</p></div>';
            return;
        }

        grid.innerHTML = loadedGallery.map(item => `
            <div class="admin-card">
                <div class="card-thumb-container">
                    <img src="${item.imageUrl}" alt="${escapeHtml(item.title || 'Photo')}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image';">
                </div>
                <div class="card-body">
                    <div>
                        <h3>${escapeHtml(item.title || 'Untitled Photo')}</h3>
                        ${item.description ? `<p class="card-desc">${escapeHtml(item.description)}</p>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="card-edit-btn" data-type="gallery" data-id="${item._id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="card-delete-btn" data-type="gallery" data-id="${item._id}" data-name="${escapeHtml(item.title || 'this photo')}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error fetching gallery:', err);
        if (grid) grid.innerHTML = `<div class="empty-state" style="color:red;"><p>Error loading gallery: ${err.message}</p></div>`;
    }
}

// Fetch and Render Events
function renderEventsGrid() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    const countBadge = document.getElementById('events-count');
    const filter = document.getElementById('event-placement-filter')?.value || 'all';

    let filtered = loadedEvents;
    if (filter === 'main_event') {
        filtered = loadedEvents.filter(e => e.eventType === 'main_event' || (!e.parentEvent && (e.category || '').toLowerCase() === 'session'));
    } else if (filter === 'sub_event') {
        filtered = loadedEvents.filter(e => e.eventType !== 'main_event' && (e.parentEvent || (e.category || '').toLowerCase() !== 'session'));
    }

    if (countBadge) countBadge.textContent = `${filtered.length} items`;

    if (!filtered || filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>No items found for this filter. Click "+ Add Event / Game" to add one!</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(evt => {
        const isClosed = (evt.status || 'OPEN').toUpperCase() === 'CLOSED';
        const statusClass = isClosed ? 'closed' : 'open';
        const statusText = isClosed ? 'CLOSED' : 'OPEN';

        const isMain = evt.eventType === 'main_event' || (!evt.parentEvent && (evt.category || '').toLowerCase() === 'session');
        const placementBadge = isMain
            ? `<span class="card-badge-placement main"><i class="fas fa-trophy"></i> Main Event</span>`
            : `<span class="card-badge-placement sub"><i class="fas fa-gamepad"></i> Game under ${escapeHtml(evt.parentEvent || 'ELEVATE')}</span>`;

        return `
        <div class="admin-card">
            <div class="card-thumb-container">
                <img src="${evt.imageUrl || 'https://via.placeholder.com/400x200?text=Event+Banner'}" alt="${escapeHtml(evt.title)}" onerror="this.src='https://via.placeholder.com/400x200?text=Event+Banner';">
            </div>
            <div class="card-body">
                <div>
                    <div>${placementBadge}</div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                        <h3 style="margin: 0;">${escapeHtml(evt.title)}</h3>
                        <span class="card-badge-status ${statusClass}">${statusText}</span>
                    </div>
                    ${evt.subtitle ? `<div class="card-subtitle">${escapeHtml(evt.subtitle)}</div>` : ''}
                    
                    <div class="card-meta-row">
                        ${evt.category ? `<span class="card-meta-item"><i class="fas fa-tag"></i> ${escapeHtml(evt.category)}</span>` : ''}
                        ${evt.date ? `<span class="card-meta-item"><i class="fas fa-calendar-alt"></i> ${escapeHtml(evt.date)}</span>` : ''}
                        ${evt.time ? `<span class="card-meta-item"><i class="fas fa-clock"></i> ${escapeHtml(evt.time)}</span>` : ''}
                        ${evt.venue ? `<span class="card-meta-item"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(evt.venue)}</span>` : ''}
                        ${evt.fee ? `<span class="card-meta-item"><i class="fas fa-ticket-alt"></i> ${escapeHtml(evt.fee)}</span>` : ''}
                        ${evt.prize ? `<span class="card-meta-item"><i class="fas fa-trophy"></i> ${escapeHtml(evt.prize)}</span>` : ''}
                        ${evt.slots ? `<span class="card-meta-item"><i class="fas fa-users"></i> ${escapeHtml(evt.slots)}</span>` : ''}
                    </div>

                    ${evt.about ? `<p class="card-desc" style="-webkit-line-clamp: 2;">${escapeHtml(evt.about)}</p>` : ''}
                </div>
                <div class="card-actions">
                    <button class="card-edit-btn" data-type="events" data-id="${evt._id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="card-delete-btn" data-type="events" data-id="${evt._id}" data-name="${escapeHtml(evt.title)}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

async function fetchEvents() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    try {
        const res = await fetch('/api/events');
        const events = await res.json();
        loadedEvents = Array.isArray(events) ? events : [];
        try {
            localStorage.setItem('vortex_cached_events', JSON.stringify(loadedEvents));
        } catch(e) {}
        renderEventsGrid();
    } catch (err) {
        console.error('Error fetching events:', err);
        grid.innerHTML = `<div class="empty-state" style="color:red;"><p>Error loading events: ${err.message}</p></div>`;
    }
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
