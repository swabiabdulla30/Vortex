const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function makeAdmin(email) {
    // MongoDB Connection Strategy (Same as server.js)
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/vortex", {
            serverSelectionTimeoutMS: 2000
        });
        console.log("MongoDB Connected (Local)");
    } catch (err) {
        console.log("Local MongoDB not found. Connecting to embedded...");
        const dbPath = path.join(__dirname, '.vortex_db_data');
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create({
            instance: {
                dbPath: dbPath,
                storageEngine: "wiredTiger"
            }
        });
        const uri = mongod.getUri();
        await mongoose.connect(uri);
    }

    const UserSchema = new mongoose.Schema({
        name: String,
        email: { type: String, unique: true },
        password: String,
        role: { type: String, default: "user" }
    });

    // Check if model already exists to avoid overwrite error
    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    const user = await User.findOne({ email });
    if (!user) {
        console.log(`User with email ${email} not found.`);
    } else {
        user.role = "admin";
        await user.save();
        console.log(`SUCCESS: User ${user.name} (${email}) is now an ADMIN.`);
    }

    await mongoose.disconnect();
    process.exit();
}

const email = process.argv[2];
if (!email) {
    console.log("Usage: node make_admin.js <email>");
    process.exit(1);
}

makeAdmin(email);
