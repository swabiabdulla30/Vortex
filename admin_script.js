let allRegistrations = [];

async function fetchData() {
    const token = localStorage.getItem('vortexToken');
    if (!token) {
        window.location.href = 'login.html';
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
            window.location.href = 'login.html';
            return;
        }

        if (res.status === 403) {
            alert("Access Denied: Admin privileges required.");
            window.location.href = 'index.html';
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

function getFilteredRegistrations() {
    const eventFilter = document.getElementById('event-filter')?.value || 'all';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';

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

    return { filtered, eventFilter, statusFilter };
}

function exportExcel() {
    const { filtered, eventFilter, statusFilter } = getFilteredRegistrations();

    if (!filtered || filtered.length === 0) {
        alert("No data available to export.");
        return;
    }

    try {
        const headers = ["Ticket ID", "Name", "Event", "Email", "Phone", "Department", "Year", "College", "Date", "Payment Status", "Transaction ID"];
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
            r.transactionId || r.paymentId || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Build descriptive filename based on active filters
        const datePart = new Date().toISOString().slice(0, 10);
        const eventPart = eventFilter !== 'all' ? `_${eventFilter.replace(/\s+/g, '_')}` : '_AllEvents';
        const statusPart = statusFilter !== 'all' ? `_${statusFilter}` : '';
        const filename = `vortex${eventPart}${statusPart}_${datePart}.csv`;

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
    const eventFilterEl = document.getElementById('event-filter');
    const statusFilterEl = document.getElementById('status-filter');
    if (!eventFilterEl || !statusFilterEl) return;

    const eventFilter = eventFilterEl.value;
    const statusFilter = statusFilterEl.value;

    let filteredData = allRegistrations;

    if (eventFilter !== 'all') {
        filteredData = filteredData.filter(item => item.event === eventFilter);
    }

    if (statusFilter !== 'all') {
        if (statusFilter === 'PAID') {
            filteredData = filteredData.filter(item => item.paymentStatus === 'PAID');
        } else {
            // PENDING logic
            filteredData = filteredData.filter(item => item.paymentStatus !== 'PAID');
        }
    }

    renderTable(filteredData);
}

function renderTable(data) {
    const tbody = document.getElementById('data-body');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No registrations found.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => {
        const isPaid = item.paymentStatus === 'PAID';

        return `
        <tr>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td>
                <div style="font-weight:bold;">${item.name}</div>
                <div style="font-size:0.8em; color:#aaa;">${item.email}</div>
            </td>
            <td>${item.phone}</td>
            <td>${item.event}</td>
            <td>
                <div style="font-size:0.85em;">
                    ${item.department}<br>
                    ${item.year}Yr • ${item.college}
                </div>
            </td>
            <td class="${isPaid ? 'status-paid' : 'status-pending'}">
                ${item.paymentStatus || 'PENDING'}
            </td>
            <td>
                ${!isPaid ?
                `<button data-action="approve" data-id="${item.ticketId}" class="action-btn" style="background:#00ff88; color:black; margin-bottom:5px;">Approve</button>` :
                ''}
                <button data-action="delete" data-id="${item.ticketId || item._id}" class="action-btn delete-btn">Delete</button>
            </td>
        </tr>
    `}).join('');
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

function logout() {
    localStorage.removeItem('vortexToken');
    localStorage.removeItem('vortexCurrentUser');
    window.location.href = 'index.html';
}

// Event Listeners (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    // Initial Fetch
    fetchData();

    // Button Listeners
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', fetchData);

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportExcel);

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

    // Event Delegation for Table Actions
    const dataBody = document.getElementById('data-body');
    if (dataBody) {
        dataBody.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON') {
                const action = target.getAttribute('data-action');
                const id = target.getAttribute('data-id');

                if (action === 'approve') {
                    verifyPayment(id, 'approve');
                } else if (action === 'delete') {
                    deleteRegistration(id);
                }
            }
        });
    }
});
