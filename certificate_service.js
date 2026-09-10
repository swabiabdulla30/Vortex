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
        path.join(__dirname, 'templates', 'certificate-template.png'),
        path.join(__dirname, 'templates', 'certificate-template.jpg'),
        path.join(__dirname, 'templates', 'certificate-template.jpeg'),
        path.join(__dirname, 'templates', 'certificate-template.pdf'),
        path.join(process.cwd(), 'templates', 'certificate-template.png'),
        path.join(process.cwd(), 'templates', 'certificate-template.jpg'),
        path.join(process.cwd(), 'templates', 'certificate-template.jpeg'),
        path.join(process.cwd(), 'templates', 'certificate-template.pdf')
    ],

    // Canvas dimensions (matches 1376x768 landscape)
    width: 1376,
    height: 768,

    // Text positions & colors
    colors: {
        primary: rgb(0.08, 0.18, 0.36),      // Deep navy blue #142e5c
        secondary: rgb(0.65, 0.49, 0.16),    // Classic certificate gold #a67d29
        darkText: rgb(0.12, 0.12, 0.12),     // Charcoal black #1f1f1f
        mutedText: rgb(0.40, 0.40, 0.40),    // Slate grey #666666
        accentBlue: rgb(0.0, 0.45, 0.74)     // Bright accent blue
    },

    // Name positioning
    name: {
        y: 405,
        maxFontSize: 42,
        minFontSize: 24,
        maxCharacters: 20
    },

    // Event & citation positioning
    event: {
        y: 345,
        fontSize: 20
    },

    // College / Department
    institution: {
        y: 315,
        fontSize: 15
    },

    // Date
    date: {
        x: 420,
        y: 250,
        fontSize: 16
    },

    // Certificate ID & verification
    certId: {
        x: 180,
        y: 140,
        fontSize: 13
    },

    verification: {
        x: 180,
        y: 122,
        fontSize: 11
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
        page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (templatePath) {
            const imgBytes = fs.readFileSync(templatePath);
            let embeddedImg;
            if (templatePath.endsWith('.png')) {
                embeddedImg = await pdfDoc.embedPng(imgBytes);
            } else {
                embeddedImg = await pdfDoc.embedJpg(imgBytes);
            }
            page.drawImage(embeddedImg, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight
            });
        } else {
            // Draw a decorative background if no template file exists
            page.drawRectangle({
                x: 20,
                y: 20,
                width: pageWidth - 40,
                height: pageHeight - 40,
                borderColor: CONFIG.colors.secondary,
                borderWidth: 5,
                color: rgb(0.98, 0.98, 0.96)
            });
        }
    }

    // Embed standard fonts
    const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 1. Student Name (with auto-shrink & center alignment)
    const studentName = (studentData.name || 'Participant Name').trim();
    let nameFontSize = CONFIG.name.maxFontSize;
    let nameWidth = fontTimesItalic.widthOfTextAtSize(studentName, nameFontSize);

    // Auto-scale font if name is long
    const maxAvailableWidth = pageWidth * 0.65;
    while (nameWidth > maxAvailableWidth && nameFontSize > CONFIG.name.minFontSize) {
        nameFontSize -= 1;
        nameWidth = fontTimesItalic.widthOfTextAtSize(studentName, nameFontSize);
    }

    const nameX = (pageWidth - nameWidth) / 2;
    page.drawText(studentName, {
        x: nameX,
        y: CONFIG.name.y,
        size: nameFontSize,
        font: fontTimesItalic,
        color: CONFIG.colors.primary
    });

    // 2. Event / Program citation
    const eventName = (studentData.event || 'Vortex Innovators Event').toUpperCase();
    const eventText = `has successfully participated in ${eventName}`;
    const eventWidth = fontHelveticaBold.widthOfTextAtSize(eventText, CONFIG.event.fontSize);
    page.drawText(eventText, {
        x: (pageWidth - eventWidth) / 2,
        y: CONFIG.event.y,
        size: CONFIG.event.fontSize,
        font: fontHelveticaBold,
        color: CONFIG.colors.darkText
    });

    // 3. College & Department Details (if provided)
    let detailsText = 'at VORTEX INNOVATORS TECHNICAL SYMPOSIUM';
    if (studentData.college || studentData.department) {
        const parts = [];
        if (studentData.department) parts.push(studentData.department);
        if (studentData.college) parts.push(studentData.college);
        detailsText = `${parts.join(' - ')} | VORTEX 2026`;
    }
    const detailsWidth = fontHelvetica.widthOfTextAtSize(detailsText, CONFIG.institution.fontSize);
    page.drawText(detailsText, {
        x: (pageWidth - detailsWidth) / 2,
        y: CONFIG.institution.y,
        size: CONFIG.institution.fontSize,
        font: fontHelvetica,
        color: CONFIG.colors.mutedText
    });

    // 4. Issue Date
    const issueDate = studentData.date
        ? new Date(studentData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    page.drawText(issueDate, {
        x: CONFIG.date.x,
        y: CONFIG.date.y,
        size: CONFIG.date.fontSize,
        font: fontHelveticaBold,
        color: CONFIG.colors.darkText
    });

    // 5. Certificate ID
    const certIdLabel = `Certificate ID: ${certId}`;
    page.drawText(certIdLabel, {
        x: CONFIG.certId.x,
        y: CONFIG.certId.y,
        size: CONFIG.certId.fontSize,
        font: fontHelveticaBold,
        color: CONFIG.colors.secondary
    });

    // 6. Public verification note
    const baseUrl = studentData.baseUrl || 'https://vortexinnovators.com';
    const verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify/${certId}`;
    page.drawText(`Verify at: ${verifyUrl}`, {
        x: CONFIG.verification.x,
        y: CONFIG.verification.y,
        size: CONFIG.verification.fontSize,
        font: fontHelvetica,
        color: CONFIG.colors.mutedText
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
