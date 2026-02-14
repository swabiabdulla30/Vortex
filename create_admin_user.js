const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/vortex", { serverSelectionTimeoutMS: 2000 });
        console.log("Connected to MongoDB.");
    } catch (err) {
        console.error("Connection failed", err);
        process.exit(1);
    }

    const UserSchema = new mongoose.Schema({
        name: String,
        email: { type: String, unique: true },
        password: String,
        role: { type: String, default: "user" },
        createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    const email = "admin@vortex.com";
    const password = "admin";
    const name = "System Admin";

    // specific admin check
    let user = await User.findOne({ email });
    if (user) {
        console.log("Admin user already exists.");
        user.role = "admin";
        user.password = await bcrypt.hash(password, 10); // Reset password just in case
        await user.save();
        console.log("Admin user updated.");
    } else {
        const hashed = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashed, role: "admin" });
        await user.save();
        console.log("Admin user created.");
    }

    console.log(`\nCREDENTIALS:\nEmail: ${email}\nPassword: ${password}\n`);

    await mongoose.disconnect();
    process.exit();
}

createAdmin();
