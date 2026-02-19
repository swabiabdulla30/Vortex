const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Manually parse .env correctly
try {
    const envPath = path.resolve(__dirname, ".env");
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf8");
        envConfig.split(/\r?\n/).forEach(line => {
            const parts = line.split("=");
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join("=").trim(); // Rejoin in case value has =
                if (key && value) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.log("Could not read .env file");
}

let mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error("MONGODB_URI not found in .env");
    // Fallback based on what I saw earlier if .env fails to read
    mongoURI = "mongodb+srv://swabiabdulla30_db_user:swabi721@cluster0.r4pebbq.mongodb.net/?appName=Cluster0";
}

console.log("Using URI (masked):", mongoURI.replace(/:([^@]+)@/, ":****@"));

// Attempt to fix URI if it causes issues
// remove appName if it exists and causes issues
// mongoURI = mongoURI.replace("?appName=Cluster0", "").replace("&appName=Cluster0", "");

const RegistrationSchema = new mongoose.Schema({
    name: String,
    email: String,
    department: String,
    event: String,
    ticketId: String,
    paymentStatus: String,
    date: Date
}, { strict: false });

if (mongoose.models.Registration) delete mongoose.models.Registration;
const Registration = mongoose.model("Registration", RegistrationSchema);

(async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("Connected successfully.");

        const registrations = await Registration.find({}).sort({ date: -1 });
        console.log(`Found ${registrations.length} registrations:`);
        registrations.forEach(r => {
            console.log(`- [${r.ticketId}] ${r.name} (${r.email}): ${r.event} - Status: ${r.paymentStatus}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Connection failed:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
    }
})();
