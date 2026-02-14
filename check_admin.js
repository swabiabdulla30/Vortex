const mongoose = require('mongoose');

async function checkAdmin() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vortex');
        console.log("Connected to MongoDB.");

        const UserSchema = new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            password: String,
            role: { type: String, default: "user" }
        });

        const User = mongoose.model("User", UserSchema);

        const admins = await User.find({ role: 'admin' });
        console.log(`Found ${admins.length} admin users.`);
        admins.forEach(admin => console.log(`- ${admin.email}`));

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkAdmin();
