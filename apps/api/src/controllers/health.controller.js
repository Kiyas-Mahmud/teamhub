import { getMailerStatus } from '../lib/mailer.js';

export function health(req, res) {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mailer: getMailerStatus(),
  });
}
