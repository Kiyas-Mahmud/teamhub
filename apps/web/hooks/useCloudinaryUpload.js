'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

/**
 * Direct browser → Cloudinary upload with progress.
 * 1. Asks our API to sign the upload params.
 * 2. POSTs the file to https://api.cloudinary.com/v1_1/{cloud}/auto/upload via XHR
 *    so we get real progress events.
 * 3. Returns { url, publicId, name, size, type } for the caller to persist.
 */
export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  async function uploadFile(file, { folder = 'attachments', publicId } = {}) {
    if (!file) {
      throw new Error('No file provided');
    }
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const signature = await api.post('/uploads/signature', { folder, publicId });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.apiKey);
      formData.append('timestamp', String(signature.timestamp));
      formData.append('signature', signature.signature);
      if (signature.folder) formData.append('folder', signature.folder);
      if (signature.publicId) formData.append('public_id', signature.publicId);

      const payload = await xhrUpload({
        url: `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
        formData,
        onProgress: setProgress,
      });

      return {
        url: payload.secure_url,
        publicId: payload.public_id,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  return {
    uploadFile,
    uploading,
    progress,
    error,
    reset: () => {
      setProgress(0);
      setError(null);
    },
  };
}

function xhrUpload({ url, formData, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json);
        } catch (parseError) {
          reject(parseError);
        }
      } else {
        let message = 'Upload failed';
        try {
          const json = JSON.parse(xhr.responseText);
          if (json?.error?.message) message = json.error.message;
        } catch (_) {}
        reject(new Error(`${message} (HTTP ${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.send(formData);
  });
}
