import * as uploadService from '../services/upload.service.js';

export async function createUploadSignature(req, res) {
  const payload = uploadService.createUploadSignature(req.body);
  res.json(payload);
}
