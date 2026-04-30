// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

console.log("🔍 Cloudinary module loading...");

/* ===========================================================
   UPLOAD FILE TO CLOUDINARY
   filePath = local path from multer (req.file.path)
   folder   = cloudinary folder e.g. "services", "doctors", "profiles"
   =========================================================== */
export async function uploadToCloudinary(filePath, folder = "Doctor") {
  try {
    // Configure Cloudinary at runtime (after env vars are loaded)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Check credentials at function call time
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Cloudinary credentials missing:", {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✓" : "✗",
        api_key: process.env.CLOUDINARY_API_KEY ? "✓" : "✗",
        api_secret: process.env.CLOUDINARY_API_SECRET ? "✓" : "✗",
      });
      throw new Error("Cloudinary not configured. Add CLOUDINARY_* variables to .env");
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
    });

    // remove local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;  // contains { secure_url, public_id, ... }
  } catch (err) {
    console.error("Cloudinary upload error:", err.message);
    // Clean up local file on error
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {}
    }
    throw err;
  }
}

/* ===========================================================
   DELETE FROM CLOUDINARY (optional)
   Pass public_id from database
   =========================================================== */
export async function deleteFromCloudinary(publicId) {
  try {
    if (!publicId) return;

    // Configure Cloudinary at runtime (after env vars are loaded)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    throw err;
  }
}

export default cloudinary;
