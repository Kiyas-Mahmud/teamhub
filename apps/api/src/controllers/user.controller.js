import * as userService from '../services/user.service.js';

export async function getProfile(req, res) {
  const user = await userService.getProfile(req.userId);
  res.json(user);
}

export async function updateProfile(req, res) {
  const user = await userService.updateProfile(req.userId, req.body);
  res.json(user);
}
