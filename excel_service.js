const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_FILE = path.join(__dirname, 'registrations.xlsx');

// Helper to check if we are in a read-only environment
const isReadOnlyEnv = () => {
    return process.env.VERCEL || process.env.NODE_ENV === 'production';
};

/**
 * Appends a registration to the local Excel file (Local env only)
 */
const appendRegistrationToExcel = async (registration) => {
    if (isReadOnlyEnv()) {
        console.log(`[Excel Service] Read-only environment. Skipping Excel write for: ${registration.email}`);
        return { success: true, skipped: true };
    }

    try {
        let workbook;
        if (fs.existsSync(EXCEL_FILE)) {
            workbook = xlsx.readFile(EXCEL_FILE);
        } else {
            workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet([]), "Registrations");
        }

        const worksheet = workbook.Sheets["Registrations"] || workbook.Sheets[workbook.SheetNames[0]];
        const currentData = xlsx.utils.sheet_to_json(worksheet) || [];

        const newRow = {
            "Ticket ID": registration.ticketId || '',
            "Name": registration.name || '',
            "Email": registration.email || '',
            "Phone": registration.phone || '',
            "College": registration.college || '',
            "Department": registration.department || '',
            "Year": registration.year || '',
            "Event": registration.event || '',
            "Date": registration.date ? new Date(registration.date).toLocaleString() : '',
            "Payment Status": registration.paymentStatus || 'PENDING'
        };

        currentData.push(newRow);

        const newWorksheet = xlsx.utils.json_to_sheet(currentData);
        workbook.Sheets["Registrations"] = newWorksheet;

        xlsx.writeFile(workbook, EXCEL_FILE);
        console.log(`[Excel Service] Saved registration for ${registration.email}`);
        return { success: true };
    } catch (error) {
        console.error("[Excel Service] Error writing to Excel:", error);
        return { success: false, error: error.message };
    }
};

const startExcelService = () => {
    if (!isReadOnlyEnv()) {
        console.log("[Excel Service] initialized in writable mode.");
    } else {
        console.log("[Excel Service] initialized in read-only mode (Vercel).");
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
