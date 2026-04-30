import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
const envPath = path.join(__dirname, ".env");
console.log("📁 Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn("⚠️ .env file not found or error reading:", result.error.message);
} else {
  console.log("✅ .env file loaded successfully");
  console.log("Loaded variables:", Object.keys(result.parsed || {}).join(", "));
}

import express from "express";
import cors from "cors";
import doctorRouter from "./routes/doctorRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import serviceRouter from "./routes/serviceRoutes.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRouter.js";
import { connectDB } from "./config/db.js";

// Connect to database
connectDB();

const app = express();

// ================= CORS FIX =================
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("API running 🚀");
});
let doctors = [];
// ================= MAIN ROUTERS =================
app.use("/api/doctors", doctorRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/services", serviceRouter);
app.use("/api/service-appointments", serviceAppointmentRouter);

// ================= 404 HANDLER =================
app.use((req, res) => {
  console.log("❌ Route not found:", req.method, req.url);
  res.status(404).json({ message: "Route not found" });
});

// ================= SERVER =================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});