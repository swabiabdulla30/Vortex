const mongoose = require("mongoose");

const mongoURI = "mongodb+srv://swabiabdulla30_db_user:swabi721@cluster0.r4pebbq.mongodb.net/?appName=Cluster0_vortex";

const RegistrationSchema = new mongoose.Schema({
    name: String,
    email: String,
    department: String,
    event: String,
    ticketId: String,
    paymentStatus: String,
    date: Date
}, { strict: false });

const Registration = mongoose.model("Registration", RegistrationSchema);

(async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        const registrations = await Registration.find({});
        console.log(`Found ${registrations.length} registrations:`);
        registrations.forEach(r => {
            console.log(`- ${r.name} (${r.email}): ${r.event} [${r.ticketId}] - ${r.paymentStatus}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
})();
