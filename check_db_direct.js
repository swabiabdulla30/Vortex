require("dotenv").config();
const mongoose = require("mongoose");

// Construct direct connection string
const user = "swabiabdulla30_db_user";
const pass = "swabi721";
const host = "ac-ghwkoob-shard-00-00.r4pebbq.mongodb.net:27017";
// const host2 = "ac-ghwkoob-shard-00-01.r4pebbq.mongodb.net:27017";
// const host3 = "ac-ghwkoob-shard-00-02.r4pebbq.mongodb.net:27017";

// Try direct connection to primary/secondary
const mongoURI = `mongodb://${user}:${pass}@${host}/?ssl=true&authSource=admin&directConnection=true`;

console.log("Testing DIRECT connection to:", host);

(async () => {
    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ SUCCESS: Connected to MongoDB (Direct Mode)!");

        // Try to find the replica set name
        const admin = mongoose.connection.db.admin();
        const status = await admin.command({ replSetGetStatus: 1 });
        console.log("Replica Set Name:", status.set);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Connection failed:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
    }
})();
