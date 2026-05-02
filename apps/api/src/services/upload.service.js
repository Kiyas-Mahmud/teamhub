import { generateSignature } from '../lib/cloudinary.js';

const ALLOWED_FOLDERS = new Set(['avatars', 'attachments']);

export function createUploadSignature({ folder, publicId, transformation }) {
  const safeFolder = ALLOWED_FOLDERS.has(folder) ? folder : 'attachments';
  return generateSignature({
    folder: safeFolder,
    publicId,
    transformation,
  });
}
