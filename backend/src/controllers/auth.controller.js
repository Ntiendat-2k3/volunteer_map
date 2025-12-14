const { asyncHandler } = require("../middlewares/asyncHandler");
const { ok, created } = require("../utils/response");
const { env } = require("../config/env");
const authService = require("../services/auth.service");
const tokenService = require("../services/token.service");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return created(res, { user });
});

const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.user);
  tokenService.setRefreshCookie(res, refreshToken);
  return ok(res, { accessToken, user });
});

const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[env.jwt.refreshCookieName];
  const { accessToken, refreshToken, user } = await authService.refresh(raw);
  tokenService.setRefreshCookie(res, refreshToken);
  return ok(res, { accessToken, user });
});

const logout = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[env.jwt.refreshCookieName];
  await authService.logout(raw);
  tokenService.clearRefreshCookie(res);
  return ok(res, { message: "Logged out" });
});

const me = asyncHandler(async (req, res) => ok(res, { user: req.user }));

module.exports = { register, login, refresh, logout, me };
