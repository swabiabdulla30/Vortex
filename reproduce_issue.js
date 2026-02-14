// Native fetch used (Node 18+)

async function testDelete() {
    try {
        // 1. Login to get token
        console.log("Logging in...");
        const loginRes = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@vortex.com', password: 'admin' }) // Assuming default admin
        });

        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Got token:", token ? "YES" : "NO");

        // 2. Create a dummy registration to delete
        console.log("Creating dummy registration...");
        const regRes = await fetch('http://127.0.0.1:5000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Delete Me",
                email: "deleteme@test.com",
                event: "Code Red",
                phone: "1234567890",
                department: "Test",
                year: "1",
                college: "Test College"
            })
        });

        const regData = await regRes.json();
        const idToDelete = regData._id;
        console.log("Created registration ID:", idToDelete);

        // 3. Try to delete it
        console.log("Attempting DELETE...");
        const deleteRes = await fetch(`http://127.0.0.1:5000/api/admin/registration/${idToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("DELETE Response Status:", deleteRes.status);
        console.log("DELETE Response Body:", await deleteRes.text());

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testDelete();
