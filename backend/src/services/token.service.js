const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { sha256 } = require("../utils/crypto");

function signAccessToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role, name: user.name ?? null },
    env.jwt.accessSecret,
    { subject: String(user.id), expiresIn: env.jwt.accessExpires }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ type: "refresh" }, env.jwt.refreshSecret, {
    subject: String(user.id),
    expiresIn: env.jwt.refreshExpires,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

function hashRefreshToken(token) {
  return sha256(token);
}

function cookieOptions() {
  const isProd = env.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
    maxAge: env.jwt.refreshCookieMaxAgeMs,
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(env.jwt.refreshCookieName, refreshToken, cookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(env.jwt.refreshCookieName, { path: "/api/auth" });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
