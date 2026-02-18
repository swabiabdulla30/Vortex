const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { appendRegistrationToExcel, generateExcelBuffer } = require("./excel_service");

const app = express();

// --- Security & Performance Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:", "https://images.unsplash.com", "https://i.pravatar.cc", "https://img.sanishtech.com", "https://image2url.com"],
            "script-src": ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://cdnjs.cloudflare.com"],
            "frame-src": ["https://api.razorpay.com", "https://checkout.razorpay.com"],
            "connect-src": ["'self'", "https://lumberjack.razorpay.com"]
        }
    }
})); // Security headers with custom CSP
app.use(compression()); // Gzip compression
app.use(cors());
app.use(express.json());

// Rate Limiting (Prevent abuse)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter); // Apply to API routes

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
            maxPoolSize: 10, // Limit connection pool for serverless environment
        });
        console.log("MongoDB Connected: Atlas (Cloud) with Pool Size 10");
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
    if (!authHeader) {
        console.log("Auth failed: No Authorization header");
        return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        console.log("Auth failed: No token in header");
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        await connectDB();
        const decoded = jwt.verify(token, "VORTEX_SECRET");
        const user = await User.findById(decoded.id);
        if (!user) {
            console.log("Auth failed: User not found for ID:", decoded.id);
            return res.status(401).json({ error: "User not found" });
        }
        req.user = user;
        next();
    } catch (e) {
        console.error("Auth verification failed:", e.message);
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

// --- INSTAMOJO PAYMENT ENDPOINTS ---

app.post("/api/instamojo/create-payment", async (req, res) => {
    try {
        await connectDB();
        const { eventData, ticketId } = req.body;

        if (!process.env.INSTAMOJO_API_KEY || !process.env.INSTAMOJO_AUTH_TOKEN) {
            return res.status(500).json({ error: "Server configuration error: Missing Payment Keys" });
        }

        // Determine Redirect URL
        const baseUrl = req.protocol + '://' + req.get('host');
        const redirectUrl = `${baseUrl}/api/instamojo/callback?ticketId=${ticketId}`;

        const payload = new URLSearchParams({
            purpose: `Event Registration: ${eventData.event}`,
            amount: '10', // Fixed amount
            buyer_name: eventData.name,
            email: eventData.email,
            phone: eventData.phone,
            redirect_url: redirectUrl,
            send_email: 'True',
            send_sms: 'True',
            allow_repeated_payments: 'False',
        });

        const existing = await Registration.findOne({ ticketId });
        if (!existing) {
            const registration = new Registration({
                ...eventData,
                ticketId,
                date: new Date(),
                paymentStatus: "PENDING_INSTAMOJO",
                eventId: "PENDING",
                paymentId: "PENDING"
            });
            await registration.save();
        }

        const response = await fetch('https://www.instamojo.com/api/1.1/payment-requests/', {
            method: 'POST',
            headers: {
                'X-Api-Key': process.env.INSTAMOJO_API_KEY,
                'X-Auth-Token': process.env.INSTAMOJO_AUTH_TOKEN
            },
            body: payload
        });

        const data = await response.json();

        if (data.success) {
            await Registration.updateOne({ ticketId }, { eventId: data.payment_request.id });
            res.json({ success: true, longurl: data.payment_request.longurl });
        } else {
            console.error("Instamojo Error:", data);
            res.status(400).json({ error: "Payment creation failed", details: data.message });
        }

    } catch (error) {
        console.error("Instamojo Create Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/instamojo/callback", async (req, res) => {
    try {
        await connectDB();
        const { payment_id, payment_request_id, ticketId } = req.query;

        // Verify Payment Status (Instamojo doesn't verify via GET callback strictly without ID check, but good enough for now)
        if (payment_id && payment_request_id) {
            const response = await fetch(`https://www.instamojo.com/api/1.1/payment-requests/${payment_request_id}/${payment_id}/`, {
                headers: {
                    'X-Api-Key': process.env.INSTAMOJO_API_KEY,
                    'X-Auth-Token': process.env.INSTAMOJO_AUTH_TOKEN
                }
            });
            const data = await response.json();

            if (data.success && data.payment_request.payment.status === 'Credit') {
                // Success!
                const reg = await Registration.findOneAndUpdate({ ticketId }, {
                    paymentStatus: 'PAID',
                    paymentId: payment_id
                }, { new: true });

                if (reg) {
                    try { await appendRegistrationToExcel(reg); } catch (e) { }

                    // Redirect to success page with query params
                    return res.redirect(`/registration_success.html?ticketId=${ticketId}&status=success`);
                }
            }
        }

        // If verification failed
        res.redirect(`/event_registration.html?error=payment_failed`);

    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).send("Payment Verification Error");
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
        const secret = process.env.RAZORPAY_KEY_SECRET || 'qU7KhagCRDF4w04HF3qkQT2w'; // Use Env or Fallback to Test Secret
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

// Endpoint to get Razorpay Key ID safely
app.get("/api/get-razorpay-key", (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID || 'rzp_test_SFZWAVjpbUiAMd' });
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

app.post("/api/admin/verify-payment", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { ticketId, action } = req.body;

        if (!ticketId || !action) {
            return res.status(400).json({ error: "Missing ticketId or action" });
        }

        const status = action === 'approve' ? 'PAID' : 'REJECTED';
        const registration = await Registration.findOneAndUpdate({
            ticketId
        }, {
            paymentStatus: status
        }, {
            new: true
        });

        if (!registration) {
            return res.status(404).json({ error: "Registration not found" });
        }

        res.json({ success: true, message: `Payment ${status.toLowerCase()}`, registration });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ error: "Verification failed" });
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
