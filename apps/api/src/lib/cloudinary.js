import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Sign upload params for direct browser-to-Cloudinary upload.
 * Returns the signature plus everything the client needs to call /upload.
 */
export function generateSignature({ folder, publicId, transformation } = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    ...(folder ? { folder } : {}),
    ...(publicId ? { public_id: publicId } : {}),
    ...(transformation ? { transformation } : {}),
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    timestamp,
    folder: folder || null,
    publicId: publicId || null,
    transformation: transformation || null,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}

/**
 * Delete a Cloudinary asset. Safe to call with falsy publicId — no-op.
 * Resource type detection: if publicId hints at video/raw, override.
 */
export async function deleteFile(publicId, { resourceType = 'image' } = {}) {
  if (!publicId) return null;
  if (!isCloudinaryConfigured()) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result;
  } catch (error) {
    // Don't crash the request on cleanup failures — log and move on.
    console.error('[cloudinary.deleteFile] failed', { publicId, error: error.message });
    return null;
  }
}
