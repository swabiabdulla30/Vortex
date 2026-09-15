const fs = require('fs');
const path = require('path');
const os = require('os');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Coordinate and styling configuration for the certificate.
 * Note: In pdf-lib, (0,0) is at the BOTTOM-LEFT corner.
 */
const CONFIG = {
    // Template paths to check (supports local and Vercel serverless cwd)
    templatePaths: [
        path.join(__dirname, 'templates', 'certificate-template.jpg'),
        path.join(__dirname, 'templates', 'certificate for participation with logo.jpg'),
        path.join(__dirname, 'certificate for participation with logo.jpg'),
        path.join(__dirname, 'templates', 'certificate-template.png'),
        path.join(__dirname, 'templates', 'certificate-template.jpeg'),
        path.join(__dirname, 'templates', 'certificate-template.pdf'),
        path.join(process.cwd(), 'templates', 'certificate-template.jpg'),
        path.join(process.cwd(), 'templates', 'certificate for participation with logo.jpg'),
        path.join(process.cwd(), 'certificate for participation with logo.jpg'),
        path.join(process.cwd(), 'templates', 'certificate-template.png'),
        path.join(process.cwd(), 'templates', 'certificate-template.jpeg'),
        path.join(process.cwd(), 'templates', 'certificate-template.pdf')
    ],

    // Default Canvas dimensions (matches 2000x1414 certificate template)
    width: 2000,
    height: 1414,

    // Text colors tailored to match the INNEXA / KMCT gold and navy certificate aesthetic
    colors: {
        primary: rgb(0.07, 0.15, 0.30),      // Deep navy blue #12264c
        gold: rgb(0.61, 0.45, 0.14)          // Rich certificate gold #9b7323
    },

    // Name positioning (centered between header and participation line)
    name: {
        y: 752,
        maxFontSize: 60,
        minFontSize: 28,
        maxAvailableWidthRatio: 0.70
    },

    // Event on the underline
    event: {
        centerX: 1229,
        underlineStartX: 1082,
        underlineEndX: 1376,
        y: 642,
        maxFontSize: 38,
        minFontSize: 16,
        maxWidth: 310
    }
};

/**
 * Returns a writable output directory.
 * On serverless (Vercel/Lambda), /var/task is read-only, so os.tmpdir() (/tmp) must be used.
 */
function getOutputDir() {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
        return path.join(os.tmpdir(), 'generated_certificates');
    }
    return path.join(__dirname, 'generated_certificates');
}

/**
 * Ensure output directory exists safely
 */
function ensureOutputDir(dir) {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (e) {
        console.warn(`[CERTIFICATE_SERVICE] Could not create directory ${dir}: ${e.message}`);
    }
}

/**
 * Find existing template file
 */
function getTemplatePath() {
    for (const p of CONFIG.templatePaths) {
        try {
            if (fs.existsSync(p)) return p;
        } catch (e) {
            // Ignore access errors
        }
    }
    return null;
}

/**
 * Format a unique certificate ID
 */
function generateCertificateId(counter) {
    const year = new Date().getFullYear();
    const uniqueNum = counter || Math.floor(10000 + Math.random() * 90000);
    return `CERT-${year}-${uniqueNum}`;
}

/**
 * Generates a certificate PDF for a student.
 * Designed to be 100% serverless-safe (never fails if filesystem is read-only).
 *
 * @param {Object} studentData
 * @param {string} studentData.name - Full name of student
 * @param {string} studentData.event - Event / Course title
 * @param {string} [studentData.college] - College name
 * @param {string} [studentData.department] - Department name
 * @param {Date|string} [studentData.date] - Issue date
 * @param {string} [studentData.certificateId] - Existing or custom cert ID
 * @param {string} [studentData.baseUrl] - Base URL for verification link
 * @returns {Promise<{ certificateId: string, filePath: string, fileName: string, pdfBuffer: Buffer, pdfBase64: string }>}
 */
async function generateCertificate(studentData) {
    const outputDir = getOutputDir();
    ensureOutputDir(outputDir);

    const certId = studentData.certificateId || generateCertificateId();
    const fileName = `${certId}.pdf`;
    let outputPath = path.join(outputDir, fileName);

    const templatePath = getTemplatePath();
    let pdfDoc;
    let page;
    let pageWidth = CONFIG.width;
    let pageHeight = CONFIG.height;

    if (templatePath && templatePath.endsWith('.pdf')) {
        const existingPdfBytes = fs.readFileSync(templatePath);
        pdfDoc = await PDFDocument.load(existingPdfBytes);
        page = pdfDoc.getPages()[0];
        const size = page.getSize();
        pageWidth = size.width;
        pageHeight = size.height;
    } else {
        pdfDoc = await PDFDocument.create();

        if (templatePath) {
            const imgBytes = fs.readFileSync(templatePath);
            let embeddedImg;
            if (templatePath.endsWith('.png')) {
                embeddedImg = await pdfDoc.embedPng(imgBytes);
            } else {
                embeddedImg = await pdfDoc.embedJpg(imgBytes);
            }
            pageWidth = embeddedImg.width;
            pageHeight = embeddedImg.height;
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            page.drawImage(embeddedImg, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight
            });
        } else {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            // Draw a decorative background if no template file exists
            page.drawRectangle({
                x: 20,
                y: 20,
                width: pageWidth - 40,
                height: pageHeight - 40,
                borderColor: CONFIG.colors.gold,
                borderWidth: 5,
                color: rgb(0.98, 0.98, 0.96)
            });
        }
    }

    // Embed standard fonts
    const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 1. Student Name (Centered between header and participation line)
    const studentName = (studentData.name || 'Participant Name').trim();
    let nameFontSize = CONFIG.name.maxFontSize || 60;
    let nameWidth = fontTimesItalic.widthOfTextAtSize(studentName, nameFontSize);

    // Auto-scale font if name is long
    const maxNameWidth = pageWidth * (CONFIG.name.maxAvailableWidthRatio || 0.70);
    while (nameWidth > maxNameWidth && nameFontSize > (CONFIG.name.minFontSize || 26)) {
        nameFontSize -= 1;
        nameWidth = fontTimesItalic.widthOfTextAtSize(studentName, nameFontSize);
    }

    page.drawText(studentName, {
        x: (pageWidth - nameWidth) / 2,
        y: CONFIG.name.y || 750,
        size: nameFontSize,
        font: fontTimesItalic,
        color: CONFIG.colors.primary
    });

    // 2. Event Name (Centered right on the pre-printed underline, bold & prominent)
    const rawEvent = (studentData.event || 'Vortex Event').trim().toUpperCase();
    let eventFontSize = CONFIG.event.maxFontSize || 38;
    let eventWidth = fontHelveticaBold.widthOfTextAtSize(rawEvent, eventFontSize);
    const maxEventWidth = CONFIG.event.maxWidth || 310;
    while (eventWidth > maxEventWidth && eventFontSize > (CONFIG.event.minFontSize || 16)) {
        eventFontSize -= 1;
        eventWidth = fontHelveticaBold.widthOfTextAtSize(rawEvent, eventFontSize);
    }
    const eventX = CONFIG.event.centerX - (eventWidth / 2);
    page.drawText(rawEvent, {
        x: eventX,
        y: CONFIG.event.y || 642,
        size: eventFontSize,
        font: fontHelveticaBold,
        color: CONFIG.colors.gold
    });

    // Generate binary PDF bytes in-memory
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Safe disk write (works on local or writable /tmp, gracefully catches EROFS)
    try {
        ensureOutputDir(outputDir);
        fs.writeFileSync(outputPath, pdfBytes);
    } catch (writeErr) {
        console.warn(`[CERTIFICATE_SERVICE] Notice: local disk write failed (${writeErr.message}), trying os.tmpdir().`);
        try {
            const fallbackDir = path.join(os.tmpdir(), 'generated_certificates');
            ensureOutputDir(fallbackDir);
            outputPath = path.join(fallbackDir, fileName);
            fs.writeFileSync(outputPath, pdfBytes);
        } catch (tmpErr) {
            console.warn(`[CERTIFICATE_SERVICE] Disk cache skipped (${tmpErr.message}), proceeding with in-memory buffer.`);
            outputPath = null;
        }
    }

    return {
        certificateId: certId,
        filePath: outputPath,
        fileName: fileName,
        pdfBuffer: pdfBuffer,
        pdfBase64: pdfBase64
    };
}

module.exports = {
    generateCertificate,
    generateCertificateId,
    getOutputDir,
    CONFIG
};
