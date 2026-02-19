require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error("CRITICAL ERROR: MONGODB_URI is not defined in environment variables.");
    process.exit(1);
}

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
        console.log("Attempting to connect to MongoDB...");
        console.log("URI (masked):", mongoURI.replace(/:([^@]+)@/, ":****@"));

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });

        console.log("✅ SUCCESS: Connected to MongoDB!");

        const count = await Registration.countDocuments();
        console.log(`Found ${count} total registrations.`);

        const recent = await Registration.find({}).sort({ date: -1 }).limit(5);
        if (recent.length > 0) {
            console.log("\nMost recent 5 registrations:");
            recent.forEach(r => {
                console.log(`- [${r.ticketId}] ${r.name} (${r.email}): ${r.event} - Status: ${r.paymentStatus}`);
            });
        } else {
            console.log("No registrations found.");
        }

        await mongoose.disconnect();
        console.log("\nDatabase check complete.");

    } catch (error) {
        console.error("\n❌ CONNECTION FAILED:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
    }
})();
