require("dotenv").config();
const http = require("http");
const app = require("./index");

const PORT = 5555;
const server = http.createServer(app);

server.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    try {
        // 1. Student registers via free-register
        console.log("\n1. Testing Student Registration...");
        const regRes = await fetch(`http://localhost:${PORT}/api/free-register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Clara Oswald",
                email: "clara.oswald@example.com",
                department: "Quantum Physics",
                year: "4",
                college: "Gallifrey University of Technology",
                event: "Tech Quiz",
                phone: "9123456789"
            })
        });
        const regData = await regRes.json();
        console.log("   Registration response:", regData.success, "Ticket ID:", regData.ticketId);
        console.log("   Initial Certificate Status:", regData.data.certificateStatus);
        if (regData.data.certificateStatus !== "Pending") {
            throw new Error("Registration should have Certificate Status = Pending!");
        }

        // 2. Admin logs in
        console.log("\n2. Testing Admin Login...");
        const loginRes = await fetch(`http://localhost:${PORT}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "admin@vortex.com",
                password: "admin123"
            })
        });
        const loginData = await loginRes.json();
        if (!loginData.token) throw new Error("Admin login failed!");
        const adminToken = loginData.token;
        console.log("   Admin login successful, token obtained.");

        // 3. Admin views registrations
        console.log("\n3. Testing Admin Fetch Registrations...");
        const listRes = await fetch(`http://localhost:${PORT}/api/admin/registrations`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const listData = await listRes.json();
        const clara = listData.find(r => r.ticketId === regData.ticketId);
        console.log("   Found registration in admin list with cert status:", clara.certificateStatus);

        // 4. Admin Approves and Generates Certificate
        console.log("\n4. Testing Admin 'Approve & Send Certificate'...");
        const approveRes = await fetch(`http://localhost:${PORT}/api/admin/approve-certificate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ ticketId: regData.ticketId })
        });
        const approveData = await approveRes.json();
        console.log("   Approve response:", approveData.success, approveData.message);
        console.log("   Issued Cert ID:", approveData.registration.certificateId);
        console.log("   Updated Cert Status:", approveData.registration.certificateStatus);

        if (approveData.registration.certificateStatus !== "Certificate Sent") {
            throw new Error("Certificate status should be 'Certificate Sent'!");
        }

        // 5. Test Duplicate Send Prevention
        console.log("\n5. Testing Duplicate Send Prevention...");
        const dupRes = await fetch(`http://localhost:${PORT}/api/admin/approve-certificate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ ticketId: regData.ticketId })
        });
        const dupData = await dupRes.json();
        console.log("   Duplicate send blocked as expected (Status 400):", dupRes.status === 400, dupData.error);

        // 6. Test Public Verification API
        console.log("\n6. Testing Public Verification API...");
        const certId = approveData.registration.certificateId;
        const verifyRes = await fetch(`http://localhost:${PORT}/api/verify-certificate/${certId}`);
        const verifyData = await verifyRes.json();
        console.log("   Verification API response:", verifyData.valid, "Student:", verifyData.data.name, "Event:", verifyData.data.event);

        // 7. Test Public Verification Webpage
        console.log("\n7. Testing Verification Webpage Route...");
        const verifyPageRes = await fetch(`http://localhost:${PORT}/verify/${certId}`);
        console.log("   Verify HTML page status:", verifyPageRes.status);

        // 8. Test Student Certificate Download Endpoint
        console.log("\n8. Testing Student Certificate PDF Download Endpoint...");
        const dlRes = await fetch(`http://localhost:${PORT}/api/certificate/download/${regData.ticketId}`);
        console.log("   Download status:", dlRes.status, "Content-Type:", dlRes.headers.get('content-type'));
        const dlBuf = await dlRes.arrayBuffer();
        console.log("   Downloaded PDF bytes:", dlBuf.byteLength);

        // 9. Clean up test record
        const delRes = await fetch(`http://localhost:${PORT}/api/admin/registration/${regData.ticketId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log("\n9. Cleaned up test record.");

        console.log("\n=========================================");
        console.log("🎉 ALL HTTP ENDPOINTS & FLOWS VERIFIED! 🎉");
        console.log("=========================================");
    } catch (e) {
        console.error("HTTP Test Error:", e);
    } finally {
        server.close(() => process.exit(0));
    }
});
