const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary using process.env.CLOUDINARY_URL
// If not provided here, we'll try to configure it.
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a video buffer directly to Cloudinary without writing to disk
 * Useful for Vercel Serverless File System constraints
 */
exports.uploadVideoBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured (either by URL or individual keys)
    if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn("⚠️ CLOUDINARY configuration missing. Skipping video upload.");
      return resolve(null);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'hiringsentry/interviews',
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload failed:", error);
          // Don't crash the server, just return null video URL
          resolve(null);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
