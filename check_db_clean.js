require("dotenv").config();
const mongoose = require("mongoose");

let mongoURI = process.env.MONGODB_URI;

// Remove query params to test bare connection
if (mongoURI) {
    mongoURI = mongoURI.split("?")[0];
}

if (!mongoURI) {
    console.error("URI Missing");
    process.exit(1);
}

console.log("Testing connection to:", mongoURI.replace(/:([^@]+)@/, ":****@"));

(async () => {
    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000
        });
        console.log("Connected successfully (without query params)!");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Connection failed:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
    }
})();
