const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const { appendRegistrationToExcel, generateExcelBuffer } = require("./excel_service");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
// Serve static files from the current directory
app.use(express.static(path.join(process.cwd())));

app.get('/debug-info', (req, res) => {
    try {
        const cwd = process.cwd();
        const files = fs.readdirSync(cwd);
        res.json({
            cwd: cwd,
            dirname: __dirname,
            files: files
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Database Connection ---
// --- Database Connection ---
// --- Database Connection ---
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("CRITICAL: No MONGODB_URI found in environment variables.");
            throw new Error("MONGODB_URI is not defined");
        }

        // Check if we already have a connection
        if (mongoose.connection.readyState === 1) {
            console.log("MongoDB already connected.");
            return;
        }

        const mongoURI = process.env.MONGODB_URI;

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if no connection (5s)
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        console.log("MongoDB Connected: Atlas (Cloud)");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
};

// Start services
connectDB();

// Only start Excel service if NOT in serverless env (double check)
const { startExcelService } = require("./excel_service");
if (require.main === module) {
    // Only run side effects if we are the main module (local server), not imported by Vercel
    startExcelService();
}

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Don't exit the process in serverless env
});

// --- Schemas ---
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "user" },
    role: { type: String, default: "user" },
    createdAt: { type: Date, default: Date.now }
}, {
    autoCreate: false // Disable auto-creation of collection to prevent initial connection issues
});

const RegistrationSchema = new mongoose.Schema({
    name: String,
    email: String,
    department: String,
    event: String,
    phone: String,
    year: String,
    college: String,
    date: { type: Date, default: Date.now },
    location: String,
    ticketId: String,
    paymentId: String,
    paymentStatus: { type: String, default: "PENDING" }
}, {
    autoCreate: false // Disable auto-creation of collection
});

// Force deletion of models to prevent OverwriteModelError (brute force fix for serverless)
if (mongoose.models.User) delete mongoose.models.User;
if (mongoose.models.Registration) delete mongoose.models.Registration;

const User = mongoose.model("User", UserSchema);
const Registration = mongoose.model("Registration", RegistrationSchema);

// --- Middleware ---
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
        const decoded = jwt.verify(token, "VORTEX_SECRET");
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: "User not found" });
        req.user = user;
        next();
    } catch (e) {
        console.error("Auth error:", e.message);
        return res.status(401).json({ error: "Invalid token: " + e.message });
    }
};

// --- Auth Routes ---
app.post("/api/signup", async (req, res) => {
    try {
        await connectDB();
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashed });
        await newUser.save();
        res.status(201).json({ message: "Registered successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        await connectDB();
        const { email, password } = req.body;

        // --- Lazy Admin Seeding ---
        if (email === "admin@vortex.com") {
            const adminExists = await User.findOne({ email });
            if (!adminExists) {
                console.log("Lazy seeding admin user...");
                const hashedPassword = await bcrypt.hash("admin123", 10);
                const newAdmin = new User({
                    name: "Admin User",
                    email: "admin@vortex.com",
                    password: hashedPassword,
                    role: "admin"
                });
                await newAdmin.save();
                console.log("Admin user created on-the-fly.");
            }
        }
        // --------------------------

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ error: "Wrong password" });

        const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, "VORTEX_SECRET", { expiresIn: "1h" });
        res.json({ token, user: { name: user.name, email: user.email, id: user._id, role: user.role } });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

// --- Public Routes ---
app.post("/api/register", async (req, res) => {
    try {
        await connectDB();
        const ticketId = "VTX-" + Date.now();
        const data = new Registration({ ...req.body, ticketId, date: new Date() });
        await data.save();

        // Note: Excel save is now DEFERRED until payment success

        res.status(201).json(data);
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed", details: error.message });
    }
});

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SFZWAVjpbUiAMd',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'qU7KhagCRDF4w04HF3qkQT2w'
});


// Create Order Endpoint
app.post("/api/create-order", async (req, res) => {
    try {
        const { ticketId, type } = req.body;
        let amount = 59000; // Default Membership: 590.00 INR (in paise)

        if (type === 'event') {
            amount = 100; // Event: 1.00 INR
        }

        const options = {
            amount: amount,
            currency: "INR",
            receipt: ticketId,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ error: "Order creation failed" });
    }
});

// Payment Success Endpoint (With Verification)
// Payment Success Endpoint (With Verification & Finalization)
app.post("/api/payment-success", async (req, res) => {
    try {
        await connectDB();
        const { ticketId, razorpay_payment_id, razorpay_order_id, razorpay_signature, eventData } = req.body;

        if (!ticketId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !eventData) {
            return res.status(400).json({ error: "Missing payment or registration details" });
        }

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const secret = process.env.RAZORPAY_KEY_SECRET || 'qU7KhagCRDF4w04HF3qkQT2w';
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: "Invalid payment signature" });
        }

        // --- SUCCESS LOGIC ---
        // Check if already registered (Idempotency)
        let registration = await Registration.findOne({ ticketId });
        if (registration) {
            return res.json({ success: true, message: "Registration already exists", alreadyRegistered: true });
        }

        // Create NEW Registration (Only now!)
        registration = new Registration({
            ...eventData,
            ticketId,
            date: new Date(),
            paymentStatus: "PAID", // Directly set to PAID
            eventId: razorpay_order_id, // Store order ID if needed
            paymentId: razorpay_payment_id
        });

        await registration.save();

        // Save to Excel NOW
        appendRegistrationToExcel(registration).then(result => {
            if (!result.success) console.error("Excel save failed:", result.error);
        }).catch(err => console.error("Excel save error:", err));

        res.json({ success: true, message: "Payment verified and registration complete" });
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
});

app.get("/api/ticket/:ticketId", async (req, res) => {
    try {
        await connectDB();
        const ticket = await Registration.findOne({ ticketId: req.params.ticketId });
        if (!ticket) return res.status(404).json({ error: "Not found" });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: "Error fetching ticket" });
    }
});

app.get("/api/my-tickets", async (req, res) => {
    try {
        await connectDB();
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Email required" });
        const tickets = await Registration.find({ email }).sort({ date: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: "Error fetching tickets" });
    }
});

// --- Admin Routes ---
app.get("/api/admin/export", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const registrations = await Registration.find().sort({ date: -1 });
        const buffer = generateExcelBuffer(registrations);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
        res.send(buffer);
    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ error: "Export failed" });
    }
});

app.get("/api/admin/registrations", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const registrations = await Registration.find().sort({ date: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch registrations" });
    }
});

app.delete("/api/admin/registration/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        await Registration.findByIdAndDelete(req.params.id);
        res.json({ message: "Registration deleted" });
    } catch (error) {
        res.status(500).json({ error: "Delete failed" });
    }
});

// --- Serve Frontend for any other route ---
// --- Serve Frontend for any other route ---
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Explicitly export for Vercel
module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
