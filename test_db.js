const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

(async () => {
    try {
        console.log("Starting MongoMemoryServer...");
        const mongod = await MongoMemoryServer.create({
            instance: {
                dbPath: "./vortex_db_data",
                storageEngine: "wiredTiger"
            }
        });
        const uri = mongod.getUri();
        console.log("URI:", uri);
        await mongoose.connect(uri);
        console.log("Connection Successful!");
        await mongoose.disconnect();
        await mongod.stop();
        console.log("Test Passed");
    } catch (err) {
        console.error("Test Failed:", err);
    }
})();
