import * as authService from '../services/auth.service.js';

function cookieBaseOptions() {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  const base = cookieBaseOptions();

  res.cookie('accessToken', accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  const base = cookieBaseOptions();

  res.clearCookie('accessToken', base);
  res.clearCookie('refreshToken', base);
}

export async function register(req, res) {
  const session = await authService.register(req.body);
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.status(201).json(session.user);
}

export async function login(req, res) {
  const session = await authService.login(req.body);
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.json(session.user);
}

export async function refresh(req, res) {
  const session = await authService.refreshSession(req.cookies?.refreshToken);
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.json(session.user);
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.refreshToken);
  clearAuthCookies(res);
  res.status(204).send();
}

export async function me(req, res) {
  const user = await authService.getCurrentUser(req.userId);
  res.json(user);
}
