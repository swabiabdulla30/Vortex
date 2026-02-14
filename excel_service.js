const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_FILE = path.join(__dirname, 'registrations.xlsx');
const QUEUE_FILE = path.join(__dirname, 'pending_writes.json');

// Helper to check if we are in a read-only environment
const isReadOnlyEnv = () => {
    return process.env.VERCEL || process.env.NODE_ENV === 'production';
};

const startExcelService = () => {
    // Ensure queue file exists (Only in writable environments)
    if (!isReadOnlyEnv()) {
        try {
            if (!fs.existsSync(QUEUE_FILE)) {
                fs.writeFileSync(QUEUE_FILE, JSON.stringify([]));
            }
        } catch (e) {
            console.warn("Could not create queue file (likely read-only fs):", e.message);
        }

        // Start a periodic flush check (every 10 seconds) ONLY if writable
        setInterval(flushQueue, 10000);
    }
};

/**
 * Generates an Excel buffer from an array of registration objects.
 * @param {Array} registrations 
 * @returns {Buffer}
 */
function generateExcelBuffer(registrations) {
    const workbook = xlsx.utils.book_new();

    const data = registrations.map(r => ({
        "Ticket ID": r.ticketId || '',
        "Name": r.name || '',
        "Email": r.email || '',
        "Phone": r.phone || '',
        "College": r.college || '',
        "Department": r.department || '',
        "Year": r.year || '',
        "Event": r.event || '',
        "Date": r.date ? new Date(r.date).toLocaleString() : '',
        "Payment Status": r.paymentStatus || 'PENDING'
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Registrations");

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { appendRegistrationToExcel, generateExcelBuffer, startExcelService };
