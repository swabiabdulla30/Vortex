require("dotenv").config();
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
            "img-src": ["'self'", "data:", "blob:", "https:"],
            "script-src": ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://cdnjs.cloudflare.com"],
            "frame-src": ["https://api.razorpay.com", "https://checkout.razorpay.com"],
            "connect-src": ["'self'", "https://lumberjack.razorpay.com"]
        }
    }
})); // Security headers with custom CSP
app.use(compression()); // Gzip compression
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rate Limiting (Prevent abuse)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter); // Apply to API routes

// Serve static files from the current directory
app.use(express.static(path.join(process.cwd())));

// --- Request Logger (Stability/Monitoring) ---
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) {
            console.error(`[SERVER] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
});

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
        await seedDefaultsIfNeeded();
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

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    // In a production app, you might want to log this to a service (e.g., Sentry)
});

process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
    // Optional: Graceful shutdown logic here if NOT in serverless
    // if (require.main === module) process.exit(1);
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
    paymentStatus: { type: String, default: "PENDING" },
    teammateName: String,
    teammatePhone: String
}, {
    autoCreate: false // Disable auto-creation of collection
});

const LeadMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, default: "ASSISTANT PROFESSOR" },
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { autoCreate: false });

const NetworkMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, default: "Member" },
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { autoCreate: false });

const GalleryItemSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { autoCreate: false });

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    about: { type: String, default: "" },
    rules: { type: [String], default: [] },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    venue: { type: String, default: "KMCT IETM" },
    category: { type: String, default: "Competition" },
    eventType: { type: String, default: "sub_event" }, // "main_event" (shows on events.html) or "sub_event" (shows inside parent event, e.g. elevate.html)
    parentEvent: { type: String, default: "ELEVATE" }, // e.g. "ELEVATE" or ""
    fee: { type: String, default: "Free" },
    prize: { type: String, default: "" },
    slots: { type: Number, default: 0 },
    status: { type: String, default: "OPEN" },
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { autoCreate: false });

// Force deletion of models to prevent OverwriteModelError (brute force fix for serverless)
if (mongoose.models.User) delete mongoose.models.User;
if (mongoose.models.Registration) delete mongoose.models.Registration;
if (mongoose.models.LeadMember) delete mongoose.models.LeadMember;
if (mongoose.models.NetworkMember) delete mongoose.models.NetworkMember;
if (mongoose.models.GalleryItem) delete mongoose.models.GalleryItem;
if (mongoose.models.Event) delete mongoose.models.Event;

const User = mongoose.model("User", UserSchema);
const Registration = mongoose.model("Registration", RegistrationSchema);
const LeadMember = mongoose.model("LeadMember", LeadMemberSchema);
const NetworkMember = mongoose.model("NetworkMember", NetworkMemberSchema);
const GalleryItem = mongoose.model("GalleryItem", GalleryItemSchema);
const Event = mongoose.model("Event", EventSchema);

// --- Seed Data Defaults ---
const DEFAULT_LEADS = [
    { name: "Thejas Mon P", role: "Head Of Department", imageUrl: "https://image2url.com/r2/default/images/1771389658946-0963b30b-4205-4e92-a430-30825e41dc77.jpeg", order: 1 },
    { name: "Ashwini M", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389280526-9f54b9cf-1120-4d9f-83f3-98479ec069a4.jpeg", order: 2 },
    { name: "Ansha MK", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389319263-cac79c3f-9e81-40c7-99c2-79634a44f668.jpeg", order: 3 },
    { name: "Nihala P", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389354242-f9dcdddb-b602-4427-ba50-d8e1e4bf3832.jpeg", order: 4 },
    { name: "Fidha Hanna CK", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771478466879-e722060c-199b-477b-aed3-42472dcc7478.jpeg", order: 5 },
    { name: "Anagha MS", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389421830-e4b1eaed-dc04-4dfe-b78a-2c14f6cac37b.jpeg", order: 6 },
    { name: "Kavitha GL", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389456085-d4c7bc1a-1aaf-4733-871e-1e300cdd4926.jpeg", order: 7 },
    { name: "Vaishnav", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389492199-52868bf9-1202-4773-9815-27c1ce74a60a.jpeg", order: 8 },
    { name: "Shibili PK", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389531757-12b70d0d-4494-485f-a29e-1d7a204dd05f.png", order: 9 },
    { name: "Muhammed Muhsin K", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389570271-6e9335e4-7ef5-4a04-8872-488486def1de.jpeg", order: 10 },
    { name: "Lal Jose", role: "ASSISTANT PROFESSOR", imageUrl: "https://image2url.com/r2/default/images/1771389627501-3700b5b7-6f1f-485e-91be-67e8742354e1.jpeg", order: 11 }
];

const DEFAULT_NETWORK = [
    { name: "Infa Sulaika", role: "Secretary", imageUrl: "https://image2url.com/r2/default/images/1771390191128-e884acd5-06a1-485a-9e01-834416ecd88b.jpeg", order: 1 },
    { name: "Abdulla Sabiyy", role: "Web Developer", imageUrl: "https://image2url.com/r2/default/images/1771390860933-fa6a8ffa-fc2a-47a4-baab-6580d45c5b47.jpeg", order: 2 },
    { name: "Muhammad Dhanish KK", role: "Web Developer", imageUrl: "https://image2url.com/r2/default/images/1771784328573-34d76372-ebea-4aab-9653-b366753a1832.jpeg", order: 3 },
    { name: "Heyden B John", role: "Codinator", imageUrl: "https://image2url.com/r2/default/images/1771912908132-7f9777aa-88d3-47b6-9fbd-e07d1730bf59.jpeg", order: 4 },
    { name: "Nuhman", role: "Developer", imageUrl: "https://image2url.com/r2/default/images/1771911614179-be088c7f-4917-4171-8326-76ca5079bf91.jpeg", order: 5 },
    { name: "Abdulla K", role: "Web Designer", imageUrl: "https://image2url.com/r2/default/images/1771912141381-2e90f0ab-e7f0-43b2-b5ac-8c36bf630ed6.jpeg", order: 6 }
];

const DEFAULT_GALLERY = [
    { title: "AI Drone Swarm", description: "", imageUrl: "https://image2url.com/r2/default/images/1771569580827-4ee0ab24-a2d3-4d0d-a66a-208aba1030be.jpeg", order: 1 },
    { title: "Project Alpha", description: "", imageUrl: "https://image2url.com/r2/default/images/1771569683076-ce6e76ec-af48-42cc-94d7-d8c619dd8a31.jpeg", order: 2 },
    { title: "Project Beta", description: "", imageUrl: "https://image2url.com/r2/default/images/1771819617052-114d57dc-0f21-467f-b506-2833505b5450.jpeg", order: 3 },
    { title: "Project Gamma", description: "", imageUrl: "https://image2url.com/r2/default/images/1771819688277-dc635bb1-c354-4d38-87fa-dc391326a46f.jpeg", order: 4 },
    { title: "Cyber Security", description: "", imageUrl: "https://image2url.com/r2/default/images/1771908143354-c5d74dd0-b5c8-49f0-8f90-dd41ce49254f.jpeg", order: 5 },
    { title: "IoT Hub", description: "", imageUrl: "https://image2url.com/r2/default/images/1771824123594-16841d17-37b0-4c20-9ad4-0ef99a9df4b0.jpeg", order: 6 },
    { title: "Blockchain", description: "", imageUrl: "https://image2url.com/r2/default/images/1771830281432-e3e48f8b-41f2-449d-86d5-c111152c0a59.jpeg", order: 7 },
    { title: "AR Navigation", description: "", imageUrl: "https://image2url.com/r2/default/images/1771907338001-5afd4a5a-a57d-4518-be73-68d49f2d5b12.jpeg", order: 8 },
    { title: "Gallery Event Image 1", description: "", imageUrl: "https://image2url.com/r2/default/images/1773380215651-c30e4c82-6cbe-4bb4-bed0-2f2d39e144c5.jpeg", order: 9 },
    { title: "Gallery Event Image 2", description: "", imageUrl: "https://image2url.com/r2/default/images/1773384921119-ae74a290-013c-4452-a559-17e9f836a7d4.jpeg", order: 10 },
    { title: "Gallery Event Image 3", description: "", imageUrl: "https://image2url.com/r2/default/images/1773384957631-3060572f-2a84-4b75-ad39-f4fdf1e66672.jpeg", order: 11 },
    { title: "Gallery Event Image 4", description: "", imageUrl: "https://image2url.com/r2/default/images/1773385004377-ef0f8ccd-42cc-4c1e-af9a-83efa242dd6a.jpeg", order: 12 },
    { title: "Gallery Event Image 5", description: "", imageUrl: "https://image2url.com/r2/default/images/1773385079047-85d90ff2-863e-4c7c-98ad-6b5785dd9c5d.jpeg", order: 13 },
    { title: "Gallery Event Image 6", description: "", imageUrl: "https://image2url.com/r2/default/images/1773385220981-ed136415-8cf5-4f62-8172-f49514949c02.jpeg", order: 14 }
];

async function seedDefaultsIfNeeded() {
    try {
        const leadCount = await LeadMember.countDocuments();
        if (leadCount === 0) {
            await LeadMember.insertMany(DEFAULT_LEADS);
            console.log("Seeded initial lead members.");
        }
        const netCount = await NetworkMember.countDocuments();
        if (netCount === 0) {
            await NetworkMember.insertMany(DEFAULT_NETWORK);
            console.log("Seeded initial network members.");
        }
        const galCount = await GalleryItem.countDocuments();
        if (galCount === 0) {
            await GalleryItem.insertMany(DEFAULT_GALLERY);
            console.log("Seeded initial gallery items.");
        }
        const evCount = await Event.countDocuments();
        if (evCount === 0) {
            await Event.insertMany(DEFAULT_EVENTS);
            console.log("Seeded initial events.");
        } else {
            // Backfill eventType and parentEvent if missing
            await Event.updateMany(
                { title: { $in: ["ELEVATE", "TECHSPARK", "VORTEX INNOVATORS"] }, eventType: { $exists: false } },
                { $set: { eventType: "main_event", parentEvent: "" } }
            );
            await Event.updateMany(
                { title: { $nin: ["ELEVATE", "TECHSPARK", "VORTEX INNOVATORS"] }, eventType: { $exists: false } },
                { $set: { eventType: "sub_event", parentEvent: "ELEVATE" } }
            );
        }
    } catch (err) {
        console.error("Error checking/seeding defaults:", err.message);
    }
}

const DEFAULT_EVENTS = [
    {
        title: "ELEVATE",
        description: "To Lift Up, Raise Higher or Improve.",
        about: "A flagship event focusing on career development, soft skills, and industry insights from experts. Elevate yourself with knowledge, networking, and inspiration.",
        date: "MAR 05 - 06",
        time: "9:30 AM - 4:00 PM",
        venue: "KMCT IETM",
        category: "Session",
        eventType: "main_event",
        parentEvent: "",
        fee: "Free",
        prize: "",
        slots: 0,
        status: "OPEN",
        imageUrl: "https://image2url.com/r2/default/images/1771924612874-479e698d-1dfb-49ec-90d2-a203530cd141.png",
        order: 1
    },
    {
        title: "TECHSPARK",
        description: "Igniting the next generation of innovators.",
        about: "Introduction to ethical hacking and cybersecurity defense mechanisms. Learn how to protect systems from vulnerabilities in this hands-on workshop.",
        date: "AUG 26",
        time: "10:00 AM - 1:00 PM",
        venue: "KMCT IETM",
        category: "Session",
        eventType: "main_event",
        parentEvent: "",
        fee: "Free",
        prize: "",
        slots: 0,
        status: "CLOSED",
        imageUrl: "https://image2url.com/r2/default/images/1771924658426-b7ca4811-d7d7-4f79-b1e9-64e516259d86.jpeg",
        order: 2
    },
    {
        title: "VORTEX INNOVATORS",
        description: "Exploring the future of Generative AI.",
        about: "Explore the cutting-edge of Artificial Intelligence and Generative models. Understand the future of AI technology in this insightful tech talk.",
        date: "MAR 19",
        time: "11:00 AM - 1:00 PM",
        venue: "KMCT IETM",
        category: "Session",
        eventType: "main_event",
        parentEvent: "",
        fee: "Free",
        prize: "",
        slots: 0,
        status: "CLOSED",
        imageUrl: "https://image2url.com/r2/default/images/1771925799245-91e45052-89b2-48d4-98f4-5f7081da8dbe.jpeg",
        order: 3
    },
    {
        title: "BGMI",
        description: "Together till the last circle.",
        about: "<strong>🎮 PUBG Mobile Tournament (Livik Map)</strong><br><br><strong>📌 Tournament Details:</strong><br>Map: Livik<br>Mode: Squad (TPP)<br>Total Teams: 12<br>Total Players: 48<br>Registration Fee: ₹10 per player<br>Total Prize Pool: ₹300<br>Duration: 1.5 Hours",
        date: "MAR 06",
        time: "2:00PM - 3:00PM",
        venue: "Seminar Hall",
        category: "Competition",
        eventType: "sub_event",
        parentEvent: "ELEVATE",
        fee: "₹10 per player",
        prize: "₹300",
        slots: 48,
        status: "CLOSED",
        imageUrl: "https://image2url.com/r2/default/images/1772176721946-d99583c6-5bb0-4e52-8e9e-781fa092d280.jpeg",
        order: 4
    },
    {
        title: "Tech Hunt",
        description: "Hunt through the web, find the prize.",
        about: "Tech Hunt is an exciting online puzzle challenge where participants are given a website filled with hidden clues and challenges. Players must carefully explore the website, solve puzzles, and find the correct extension or link to unlock the next level.",
        date: "MAR 05",
        time: "9:30AM - 11:00AM",
        venue: "Lab",
        category: "Competition",
        eventType: "sub_event",
        parentEvent: "ELEVATE",
        fee: "₹10 per participant",
        prize: "₹200",
        slots: 0,
        status: "CLOSED",
        imageUrl: "https://image2url.com/r2/default/images/1771996030667-7810be98-c833-4915-9f82-6059bb4f7259.jpeg",
        order: 5
    },
    {
        title: "Web-Designing",
        description: "Design your way to the top.",
        about: "The Web-Designing is a creative event where participants showcase their web development and design skills within the given time.",
        date: "MAR 05",
        time: "11:15AM - 12:30PM",
        venue: "Lab",
        category: "Competition",
        eventType: "sub_event",
        parentEvent: "ELEVATE",
        fee: "₹10 per participant",
        prize: "₹200",
        slots: 0,
        status: "CLOSED",
        imageUrl: "https://image2url.com/r2/default/images/1771995989097-15167040-638c-48cd-a3c0-e93ddb26f811.jpeg",
        order: 6
    },
    {
        title: "Co-op E-Football",
        description: "Pass, shoot, score together.",
        about: "The E-Football Tournament is a competitive virtual football gaming event where teams of 2 players compete in head-to-head matches.",
        date: "MAR 06",
        time: "11:00AM - 12:30PM",
        venue: "Seminar Hall",
        category: "Competition",
        eventType: "sub_event",
        parentEvent: "ELEVATE",
        fee: "₹20 per team",
        prize: "₹200",
        slots: 16,
        status: "CLOSED",
        imageUrl: "https://image2url.com/r2/default/images/1771995899025-6821ca81-a54a-4566-b29d-4fab70571c09.jpeg",
        order: 7
    },
    {
        title: "Tech Quiz",
        description: "Test your tech intellect.",
        about: "Tech Quiz is a fun team-based quiz competition for pairs (2 members per team). Test your combined knowledge across a wide range of topics.",
        date: "MAR 05",
        time: "1:45 PM - 3:00 PM",
        venue: "Lab",
        category: "Competition",
        eventType: "sub_event",
        parentEvent: "ELEVATE",
        fee: "Free",
        prize: "Cash Prize",
        slots: 10,
        status: "CLOSED",
        imageUrl: "https://image2url.com/r2/default/images/1772440085076-0f0df1c1-a19a-4351-aa02-27f67b111fa8.jpeg",
        order: 8
    },
    {
        title: "Paper-X",
        description: "Present your innovative ideas.",
        about: "PAPER-X — Paper Presentation Competition. A premier academic event where participants present original research papers or concept-based presentations.",
        date: "MAR 06",
        time: "9:30AM - 10:30AM",
        venue: "Seminar Hall",
        category: "Competition",
        eventType: "sub_event",
        parentEvent: "ELEVATE",
        fee: "Free",
        prize: "Cash Prize",
        slots: 0,
        status: "CLOSED",
        imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80",
        order: 9
    }
];

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

// Free event registration (no payment required, e.g. Tech Quiz)
app.post("/api/free-register", async (req, res) => {
    try {
        await connectDB();
        const ticketId = "VTX-" + Date.now();
        const data = new Registration({
            ...req.body,
            ticketId,
            date: new Date(),
            paymentStatus: "PAID"
        });
        await data.save();

        appendRegistrationToExcel(data).then(result => {
            if (!result.success) console.error("Excel save failed:", result.error);
        }).catch(err => console.error("Excel save error:", err));

        res.status(201).json({ success: true, ticketId, data });
    } catch (error) {
        console.error("Free registration error:", error);
        res.status(500).json({ error: "Registration failed", details: error.message });
    }
});

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SHuxeqRe0AoMNs',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'CxYBxcNKucrlnIIX9KmnKe5Q'
});


// Create Order Endpoint
app.post("/api/create-order", async (req, res) => {
    try {
        const { ticketId, type } = req.body;
        let amount = 59000; // Default Membership: 590.00 INR (in paise)

        if (type === 'event') {
            const eventNameUpper = req.body.eventName ? req.body.eventName.toUpperCase() : '';

            if (eventNameUpper.includes('CO-OP E-FOOTBALL')) {
                amount = 2000; // 20 INR
            } else if (eventNameUpper.includes('BGMI') ||
                eventNameUpper.includes('TECH HUNT') ||
                eventNameUpper.includes('WEB-DESIGNING')) {
                amount = 1000; // 10 INR
            } else {
                amount = 1000; // Default event fallback: 10 INR
            }
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

// [Deleted Instamojo Endpoints]

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
        const secret = process.env.RAZORPAY_KEY_SECRET || 'CxYBxcNKucrlnIIX9KmnKe5Q'; // Use Env or Fallback to Test Secret
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
    res.json({ key: process.env.RAZORPAY_KEY_ID || 'rzp_test_SHuxeqRe0AoMNs' });
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

// --- Public: Event Slot Availability ---
const EVENT_SLOTS = {
    "BGMI": 48,
    "TECH HUNT": 0,
    "WEB-DESIGNING": 0,
    "CO-OP E-FOOTBALL": 16,
    "TECH QUIZ": 10,
    "PAPER-X": 0
};

app.get("/api/event-slots", async (req, res) => {
    try {
        await connectDB();
        const results = await Promise.all(
            Object.entries(EVENT_SLOTS).map(async ([eventName, total]) => {
                const registered = await Registration.countDocuments({
                    event: { $regex: new RegExp(`^${eventName}$`, 'i') },
                    paymentStatus: "PAID"
                });
                return {
                    event: eventName,
                    total,
                    registered,
                    remaining: Math.max(0, total - registered)
                };
            })
        );
        res.json(results);
    } catch (error) {
        console.error("Event slots error:", error);
        res.status(500).json({ error: "Failed to fetch slot data" });
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

app.delete("/api/admin/registration/:identifier", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { identifier } = req.params;
        let result;

        if (identifier.startsWith('VTX-')) {
            result = await Registration.findOneAndDelete({ ticketId: identifier });
        } else {
            // Assume it's a Mongo _id
            if (mongoose.Types.ObjectId.isValid(identifier)) {
                result = await Registration.findByIdAndDelete(identifier);
            } else {
                return res.status(400).json({ error: "Invalid ID format" });
            }
        }

        if (!result) return res.status(404).json({ error: "Registration not found" });
        res.json({ message: "Registration deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Delete failed" });
    }
});

app.delete("/api/admin/registrations", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const result = await Registration.deleteMany({});
        res.json({ message: `Deleted ${result.deletedCount} registrations.` });
    } catch (error) {
        console.error("Delete All error:", error);
        res.status(500).json({ error: "Delete All failed" });
    }
});

// ============================================================
// --- Public Dynamic CMS Routes ---
// ============================================================
app.get("/api/leads", async (req, res) => {
    try {
        await connectDB();
        const leads = await LeadMember.find().sort({ order: 1, createdAt: 1 });
        res.json(leads);
    } catch (error) {
        console.error("Get leads error:", error);
        res.status(500).json({ error: "Failed to fetch leads" });
    }
});

app.get("/api/network", async (req, res) => {
    try {
        await connectDB();
        const members = await NetworkMember.find().sort({ order: 1, createdAt: 1 });
        res.json(members);
    } catch (error) {
        console.error("Get network error:", error);
        res.status(500).json({ error: "Failed to fetch network members" });
    }
});

app.get("/api/gallery", async (req, res) => {
    try {
        await connectDB();
        const items = await GalleryItem.find().sort({ order: 1, createdAt: 1 });
        res.json(items);
    } catch (error) {
        console.error("Get gallery error:", error);
        res.status(500).json({ error: "Failed to fetch gallery items" });
    }
});

app.get("/api/events", async (req, res) => {
    try {
        await connectDB();
        const events = await Event.find().sort({ order: 1, createdAt: 1 });
        res.json(events);
    } catch (error) {
        console.error("Get events error:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

app.get("/api/events/:id", async (req, res) => {
    try {
        await connectDB();
        let event = null;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            event = await Event.findById(req.params.id);
        }
        if (!event) {
            event = await Event.findOne({ title: { $regex: new RegExp(`^${req.params.id.trim()}$`, 'i') } });
        }
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json(event);
    } catch (error) {
        console.error("Get single event error:", error);
        res.status(500).json({ error: "Failed to fetch event" });
    }
});

// ============================================================
// --- Admin CMS Management Routes ---
// ============================================================

// --- Leads / Faculty Slider ---
app.post("/api/admin/leads", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { name, role, imageUrl, order } = req.body;
        if (!name || !imageUrl) return res.status(400).json({ error: "Name and image are required" });
        const lead = new LeadMember({
            name: name.trim(),
            role: role ? role.trim() : "ASSISTANT PROFESSOR",
            imageUrl: imageUrl.trim(),
            order: order !== undefined && order !== "" ? Number(order) : 0
        });
        await lead.save();
        res.status(201).json({ success: true, lead });
    } catch (error) {
        console.error("Create lead error:", error);
        res.status(500).json({ error: "Failed to create lead member" });
    }
});

app.delete("/api/admin/leads/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const deleted = await LeadMember.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Lead member not found" });
        res.json({ success: true, message: "Lead member removed successfully" });
    } catch (error) {
        console.error("Delete lead error:", error);
        res.status(500).json({ error: "Failed to delete lead member" });
    }
});

app.put("/api/admin/leads/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { name, role, imageUrl, order } = req.body;
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (role !== undefined) updateData.role = role.trim();
        if (imageUrl) updateData.imageUrl = imageUrl.trim();
        if (order !== undefined && order !== "") updateData.order = Number(order);

        const updated = await LeadMember.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ error: "Lead member not found" });
        res.json({ success: true, lead: updated });
    } catch (error) {
        console.error("Update lead error:", error);
        res.status(500).json({ error: "Failed to update lead member" });
    }
});

// --- Operative Network Team ---
app.post("/api/admin/network", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { name, role, imageUrl, order } = req.body;
        if (!name || !imageUrl) return res.status(400).json({ error: "Name and image are required" });
        const member = new NetworkMember({
            name: name.trim(),
            role: role ? role.trim() : "Member",
            imageUrl: imageUrl.trim(),
            order: order !== undefined && order !== "" ? Number(order) : 0
        });
        await member.save();
        res.status(201).json({ success: true, member });
    } catch (error) {
        console.error("Create network member error:", error);
        res.status(500).json({ error: "Failed to create network member" });
    }
});

app.delete("/api/admin/network/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const deleted = await NetworkMember.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Network member not found" });
        res.json({ success: true, message: "Network member removed successfully" });
    } catch (error) {
        console.error("Delete network member error:", error);
        res.status(500).json({ error: "Failed to delete network member" });
    }
});

app.put("/api/admin/network/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { name, role, imageUrl, order } = req.body;
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (role !== undefined) updateData.role = role.trim();
        if (imageUrl) updateData.imageUrl = imageUrl.trim();
        if (order !== undefined && order !== "") updateData.order = Number(order);

        const updated = await NetworkMember.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ error: "Network member not found" });
        res.json({ success: true, member: updated });
    } catch (error) {
        console.error("Update network member error:", error);
        res.status(500).json({ error: "Failed to update network member" });
    }
});

// --- Gallery Moments & Photos ---
app.post("/api/admin/gallery", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { title, description, imageUrl, order } = req.body;
        if (!imageUrl) return res.status(400).json({ error: "Image is required" });
        const item = new GalleryItem({
            title: title ? title.trim() : "",
            description: description ? description.trim() : "",
            imageUrl: imageUrl.trim(),
            order: order !== undefined && order !== "" ? Number(order) : 0
        });
        await item.save();
        res.status(201).json({ success: true, item });
    } catch (error) {
        console.error("Create gallery item error:", error);
        res.status(500).json({ error: "Failed to create gallery item" });
    }
});

app.delete("/api/admin/gallery/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const deleted = await GalleryItem.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Gallery item not found" });
        res.json({ success: true, message: "Gallery item removed successfully" });
    } catch (error) {
        console.error("Delete gallery error:", error);
        res.status(500).json({ error: "Failed to delete gallery item" });
    }
});

app.put("/api/admin/gallery/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { title, description, imageUrl, order } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (imageUrl) updateData.imageUrl = imageUrl.trim();
        if (order !== undefined && order !== "") updateData.order = Number(order);

        const updated = await GalleryItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ error: "Gallery item not found" });
        res.json({ success: true, item: updated });
    } catch (error) {
        console.error("Update gallery item error:", error);
        res.status(500).json({ error: "Failed to update gallery item" });
    }
});

// --- Events Management ---
app.post("/api/admin/events", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { title, description, about, rules, date, time, venue, category, eventType, parentEvent, fee, prize, slots, status, imageUrl, order } = req.body;
        if (!title || !imageUrl) return res.status(400).json({ error: "Title and Image are required" });

        let parsedRules = [];
        if (Array.isArray(rules)) {
            parsedRules = rules;
        } else if (typeof rules === 'string' && rules.trim()) {
            parsedRules = rules.split('\n').map(r => r.trim()).filter(Boolean);
        }

        const resolvedType = eventType === "main_event" ? "main_event" : "sub_event";
        const resolvedParent = resolvedType === "main_event" ? "" : (parentEvent ? parentEvent.trim() : "ELEVATE");

        const newEvent = new Event({
            title: title.trim(),
            description: description ? description.trim() : "",
            about: about ? about.trim() : "",
            rules: parsedRules,
            date: date ? date.trim() : "",
            time: time ? time.trim() : "",
            venue: venue ? venue.trim() : "KMCT IETM",
            category: category || "Competition",
            eventType: resolvedType,
            parentEvent: resolvedParent,
            fee: fee ? fee.trim() : "Free",
            prize: prize ? prize.trim() : "",
            slots: slots !== undefined && slots !== "" ? Number(slots) : 0,
            status: status ? status.toUpperCase() : "OPEN",
            imageUrl: imageUrl.trim(),
            order: order !== undefined && order !== "" ? Number(order) : 0
        });

        await newEvent.save();
        res.status(201).json({ success: true, event: newEvent });
    } catch (error) {
        console.error("Create event error:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
});

app.put("/api/admin/events/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const { title, description, about, rules, date, time, venue, category, eventType, parentEvent, fee, prize, slots, status, imageUrl, order } = req.body;
        const updateData = {};
        if (title) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (about !== undefined) updateData.about = about.trim();
        if (rules !== undefined) {
            updateData.rules = Array.isArray(rules) ? rules : rules.split('\n').map(r => r.trim()).filter(Boolean);
        }
        if (date !== undefined) updateData.date = date.trim();
        if (time !== undefined) updateData.time = time.trim();
        if (venue !== undefined) updateData.venue = venue.trim();
        if (category !== undefined) updateData.category = category;
        if (eventType !== undefined) {
            updateData.eventType = eventType;
            if (eventType === "main_event") updateData.parentEvent = "";
        }
        if (parentEvent !== undefined && updateData.eventType !== "main_event") {
            updateData.parentEvent = parentEvent ? parentEvent.trim() : "ELEVATE";
        }
        if (fee !== undefined) updateData.fee = fee.trim();
        if (prize !== undefined) updateData.prize = prize.trim();
        if (slots !== undefined && slots !== "") updateData.slots = Number(slots);
        if (status !== undefined) updateData.status = status.toUpperCase();
        if (imageUrl) updateData.imageUrl = imageUrl.trim();
        if (order !== undefined && order !== "") updateData.order = Number(order);

        const updated = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ error: "Event not found" });
        res.json({ success: true, event: updated });
    } catch (error) {
        console.error("Update event error:", error);
        res.status(500).json({ error: "Failed to update event" });
    }
});

app.delete("/api/admin/events/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    try {
        await connectDB();
        const deleted = await Event.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Event not found" });
        res.json({ success: true, message: "Event removed successfully" });
    } catch (error) {
        console.error("Delete event error:", error);
        res.status(500).json({ error: "Failed to delete event" });
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
