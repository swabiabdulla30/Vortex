// using native fetch

// Mocking login then fetching admin data
async function verifyAdmin() {
    try {
        // 1. Login as Admin
        const loginRes = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@vortex.com', password: 'admin' })
        });

        if (!loginRes.ok) throw new Error('Login failed: ' + loginRes.statusText);
        const loginData = await loginRes.json();
        console.log('Login successful:', loginData.user.email);
        const token = loginData.token;

        // 2. Fetch Admin Data
        const adminRes = await fetch('http://localhost:5000/api/admin/registrations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!adminRes.ok) throw new Error('Admin fetch failed: ' + adminRes.statusText);
        const adminData = await adminRes.json();
        console.log('Admin Data Fetched:', adminData.length, 'records found.');

        // 3. Verify content
        if (adminData.length > 0) {
            console.log('Sample record:', adminData[0].name);
        } else {
            console.log('No records found, but access granted.');
        }

    } catch (e) {
        console.error('Verification Error:', e);
    }
}

// Check if fetch is available globally, else polyfill or warn
if (!globalThis.fetch) {
    console.log("This script requires Node.js 18+ or node-fetch. Using native fetch if available.");
}

verifyAdmin();
