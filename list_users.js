const mongoose = require('mongoose');
const path = require('path');

async function listUsers() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/vortex", { serverSelectionTimeoutMS: 2000 });
    } catch (err) {
        const dbPath = path.join(__dirname, '.vortex_db_data');
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: "wiredTiger" } });
        await mongoose.connect(mongod.getUri());
    }

    const User = mongoose.model("User", new mongoose.Schema({
        name: String, email: String, role: String
    }));

    const users = await User.find({});
    console.log("Registered Users:");
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role || 'user'}]`));

    await mongoose.disconnect();
    process.exit();
}

listUsers();
