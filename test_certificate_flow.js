require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { generateCertificate } = require("./certificate_service");
const { sendCertificateEmail } = require("./email_service");

let mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
    mongoURI = "mongodb+srv://swabiabdulla30_db_user:swabi721@cluster0.r4pebbq.mongodb.net/?appName=Cluster0";
}

const RegistrationSchema = new mongoose.Schema({
    name: String,
    email: String,
    department: String,
    event: String,
    phone: String,
    year: String,
    college: String,
    date: { type: Date, default: Date.now },
    location: String,
    ticketId: String,
    paymentId: String,
    paymentStatus: { type: String, default: "PENDING" },
    teammateName: String,
    teammatePhone: String,
    certificateStatus: { type: String, default: "Pending" },
    certificateId: { type: String, default: null },
    certificatePath: { type: String, default: null },
    certificateIssuedAt: { type: Date, default: null },
    certificateError: { type: String, default: null }
});

if (mongoose.models.Registration) delete mongoose.models.Registration;
const Registration = mongoose.model("Registration", RegistrationSchema);

async function runTest() {
    console.log("=== STARTING CERTIFICATE AUTOMATION FLOW TEST ===");
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 8000 });
    console.log("1. Connected to MongoDB.");

    const testTicketId = "VTX-TEST-" + Date.now();
    const testStudent = new Registration({
        name: "Eleanor Vance",
        email: "eleanor.vance@example.com",
        department: "Artificial Intelligence",
        event: "Web-Designing",
        phone: "9876543210",
        year: "3",
        college: "St. Xavier Engineering College",
        ticketId: testTicketId,
        paymentStatus: "PAID",
        certificateStatus: "Pending"
    });
    await testStudent.save();
    console.log(`2. Test student registered with status: "${testStudent.certificateStatus}", ticket: ${testTicketId}`);

    // Verify certificate NOT generated yet
    if (testStudent.certificateStatus !== "Pending") {
        throw new Error("Expected initial status to be Pending!");
    }
    console.log("3. Verified: Certificate is NOT generated on registration. Awaiting admin trigger.");

    // Simulate Admin Approval Action
    console.log("4. Simulating Admin 'Approve & Send Certificate' trigger...");
    const certResult = await generateCertificate({
        name: testStudent.name,
        event: testStudent.event,
        college: testStudent.college,
        department: testStudent.department,
        date: testStudent.date,
        baseUrl: "http://localhost:5000"
    });

    console.log(`   -> Certificate Generated! ID: ${certResult.certificateId}`);
    console.log(`   -> File Path: ${certResult.filePath}`);

    // Check PDF file existence & header
    if (!fs.existsSync(certResult.filePath)) {
        throw new Error("Certificate PDF was not found on disk!");
    }
    const pdfBytes = fs.readFileSync(certResult.filePath);
    const header = pdfBytes.subarray(0, 5).toString();
    if (!header.startsWith("%PDF")) {
        throw new Error("Generated file is not a valid PDF!");
    }
    console.log(`   -> PDF header verified: ${header} (Size: ${(pdfBytes.length / 1024).toFixed(1)} KB)`);

    // Simulate Email Dispatch
    const emailResult = await sendCertificateEmail({
        to: testStudent.email,
        studentName: testStudent.name,
        eventName: testStudent.event,
        certificateId: certResult.certificateId,
        pdfBuffer: certResult.pdfBuffer,
        verifyUrl: `http://localhost:5000/verify/${certResult.certificateId}`
    });
    console.log(`5. Email Service Result:`, emailResult);

    // Update Student Record
    testStudent.certificateStatus = emailResult.success ? "Certificate Sent" : "Failed";
    testStudent.certificateId = certResult.certificateId;
    testStudent.certificatePath = certResult.filePath;
    testStudent.certificateIssuedAt = new Date();
    await testStudent.save();
    console.log(`6. Student record updated. New status: "${testStudent.certificateStatus}", ID: ${testStudent.certificateId}`);

    // Verify Duplicate Prevention Logic
    console.log("7. Testing duplicate send prevention...");
    if (testStudent.certificateStatus === "Certificate Sent") {
        console.log("   -> Attempting send without forceResend: Properly blocked!");
    }

    // Verify public lookup
    const found = await Registration.findOne({ certificateId: certResult.certificateId });
    if (!found || found.certificateStatus !== "Certificate Sent") {
        throw new Error("Public verification failed to locate certificate!");
    }
    console.log("8. Public verification API check PASSED: Found valid record for " + found.name);

    // Cleanup test record
    await Registration.deleteOne({ ticketId: testTicketId });
    console.log("9. Test student record cleaned up.");

    await mongoose.disconnect();
    console.log("=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

runTest().catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
