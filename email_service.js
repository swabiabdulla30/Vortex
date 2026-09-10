require("dotenv").config();
const nodemailer = require("nodemailer");

/**
 * Creates and returns a nodemailer transporter based on environment variables.
 */
function getTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    if (!host || !user || !pass) {
        return null; // Signals unconfigured SMTP -> fallback/simulation mode
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false // Avoid self-signed cert issues in dev
        }
    });
}

/**
 * Sends the personalized certificate to the student's email.
 *
 * @param {Object} params
 * @param {string} params.to - Student email address
 * @param {string} params.studentName - Full name of student
 * @param {string} params.eventName - Event or program name
 * @param {string} params.certificateId - Unique certificate ID
 * @param {Buffer} params.pdfBuffer - The binary PDF buffer
 * @param {string} [params.verifyUrl] - Verification URL
 * @returns {Promise<{ success: boolean, messageId?: string, simulated?: boolean, error?: string }>}
 */
async function sendCertificateEmail({ to, studentName, eventName, certificateId, pdfBuffer, verifyUrl }) {
    if (!to || !to.includes("@")) {
        return { success: false, error: "Invalid recipient email address" };
    }

    const transporter = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"Vortex Innovators" <noreply@vortexinnovators.com>';
    const filename = `${certificateId}.pdf`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0c10; color: #c5c6c7; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: #1f2833; border: 1px solid #45a29e; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
            .header { background: linear-gradient(135deg, #0b0c10 0%, #1f2833 100%); border-bottom: 2px solid #66fcf1; padding: 30px; text-align: center; }
            .header h1 { color: #66fcf1; margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase; }
            .header p { color: #c5c6c7; margin: 5px 0 0; font-size: 14px; }
            .content { padding: 30px; line-height: 1.6; color: #ffffff; }
            .highlight { color: #66fcf1; font-weight: bold; }
            .cert-box { background: rgba(102, 252, 241, 0.08); border-left: 4px solid #66fcf1; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; background: #66fcf1; color: #0b0c10 !important; text-decoration: none; padding: 12px 28px; font-weight: bold; border-radius: 6px; margin-top: 15px; }
            .footer { padding: 20px 30px; font-size: 12px; color: #888888; text-align: center; border-top: 1px solid #333333; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h1>VORTEX INNOVATORS</h1>
                <p>Official Certificate of Achievement & Participation</p>
            </div>
            <div class="content">
                <p>Dear <span class="highlight">${studentName}</span>,</p>
                <p>Congratulations! Your official certificate of participation for <strong>${eventName}</strong> at Vortex Innovators has been reviewed, approved, and officially issued.</p>
                
                <div class="cert-box">
                    <p style="margin: 0 0 5px 0;"><strong>Certificate ID:</strong> <span class="highlight">${certificateId}</span></p>
                    <p style="margin: 0;"><strong>Status:</strong> Verified & Approved ✅</p>
                </div>

                <p>Your official PDF certificate is attached to this email. You may keep this for your records or print it in high resolution.</p>
                
                ${verifyUrl ? `<p>You or prospective employers can verify the validity of this certificate at any time via the link below:</p>
                <p><a href="${verifyUrl}" class="btn" target="_blank">Verify Certificate Online</a></p>` : ''}
                
                <p style="margin-top: 30px;">Best regards,<br><strong>The Vortex Innovators Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated delivery from Vortex Innovators. Please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Fallback mode if SMTP credentials are not configured in environment
    if (!transporter) {
        console.warn(`[EMAIL_SERVICE] (DEV MODE) SMTP credentials not set in .env. Simulating email dispatch to: ${to} (Cert ID: ${certificateId})`);
        return {
            success: true,
            simulated: true,
            message: `Email delivery simulated (configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env for real emails). Recipient: ${to}`
        };
    }

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject: `Official Certificate: ${eventName} - ${studentName} [${certificateId}]`,
            text: `Dear ${studentName},\n\nCongratulations! Your certificate for ${eventName} (ID: ${certificateId}) has been issued and is attached.\n\nBest regards,\nVortex Innovators Team`,
            html: htmlContent,
            attachments: [
                {
                    filename,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });

        console.log(`[EMAIL_SERVICE] Certificate email successfully sent to ${to}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL_SERVICE] Failed to send certificate email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendCertificateEmail,
    getTransporter
};
