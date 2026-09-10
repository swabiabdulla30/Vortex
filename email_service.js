require("dotenv").config();
const nodemailer = require("nodemailer");

/**
 * Creates and returns a nodemailer transporter based on environment variables.
 * Supports standard SMTP_* as well as EMAIL_* and GMAIL_* naming conventions.
 */
function getTransporter() {
    const user = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.MAIL_USER || "").trim();
    const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.MAIL_PASS || process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || "").trim();
    let host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || "").trim();
    const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    if (!user || !pass) {
        return { transporter: null, user, pass, host, error: "Missing email username or password in environment variables (expected SMTP_USER & SMTP_PASS, or EMAIL_USER & EMAIL_PASS)" };
    }

    // Auto-detect Gmail to use Nodemailer's built-in Gmail service (bypasses serverless port blocks)
    const isGmail = host === "smtp.gmail.com" || user.toLowerCase().endsWith("@gmail.com") || process.env.SMTP_SERVICE === "gmail";
    if (isGmail) {
        return {
            transporter: nodemailer.createTransport({
                service: "gmail",
                auth: { user, pass }
            }),
            user,
            pass,
            host: "smtp.gmail.com"
        };
    }

    if (!host) {
        return { transporter: null, user, pass, host, error: "Missing SMTP_HOST in environment variables" };
    }

    return {
        transporter: nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
            tls: {
                rejectUnauthorized: false
            }
        }),
        user,
        pass,
        host
    };
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
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendCertificateEmail({ to, studentName, eventName, certificateId, pdfBuffer, verifyUrl }) {
    const cleanTo = (to || "").trim();
    if (!cleanTo || !cleanTo.includes("@")) {
        return { success: false, error: `Invalid recipient email address: "${to}"` };
    }

    const { transporter, user, error: transporterError } = getTransporter();

    if (!transporter) {
        console.error(`[EMAIL_SERVICE] Cannot send email: ${transporterError}`);
        return {
            success: false,
            error: transporterError || "SMTP credentials not configured on server"
        };
    }

    // Default sender: use authenticated user to prevent SMTP providers (like Gmail) from rejecting unverified sender
    const fromAddress = process.env.EMAIL_FROM || (user ? `"Vortex Innovators" <${user}>` : '"Vortex Innovators" <noreply@vortexinnovators.com>');
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

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to: cleanTo,
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

        console.log(`[EMAIL_SERVICE] Certificate email successfully sent to ${cleanTo}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL_SERVICE] Failed to send certificate email to ${cleanTo}:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendCertificateEmail,
    getTransporter
};
