import * as userService from '../services/user.service.js';
import * as notificationService from '../services/notification.service.js';

export async function getProfile(req, res) {
  const user = await userService.getProfile(req.userId);
  res.json(user);
}

export async function updateProfile(req, res) {
  const user = await userService.updateProfile(req.userId, req.body);
  res.json(user);
}

export async function getNotifications(req, res) {
  const items = await notificationService.listNotifications(req.userId);
  res.json({ items });
}

export async function readNotification(req, res) {
  const result = await notificationService.markRead(req.userId, req.params.id);
  res.json(result);
}

export async function readAllNotifications(req, res) {
  const result = await notificationService.markAllRead(req.userId);
  res.json(result);
}
