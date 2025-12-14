const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { ApiError } = require("../utils/apiError");
const { User, RefreshToken } = require("../models");
const tokenService = require("./token.service");

const SALT_ROUNDS = 10;

function sanitizeUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    avatarUrl: u.avatarUrl,
    provider: u.provider,
  };
}

async function register({ email, password, name }) {
  const cleanEmail = String(email || "")
    .toLowerCase()
    .trim();
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanPassword)
    throw ApiError.badRequest("Email và password là bắt buộc");
  if (cleanPassword.length < 6)
    throw ApiError.badRequest("Password tối thiểu 6 ký tự");

  const exists = await User.findOne({ where: { email: cleanEmail } });
  if (exists) throw ApiError.badRequest("Email đã tồn tại");

  const passwordHash = await bcrypt.hash(cleanPassword, SALT_ROUNDS);
  const user = await User.create({
    email: cleanEmail,
    name: name?.trim() || null,
    passwordHash,
    role: "VOLUNTEER",
  });

  return sanitizeUser(user);
}

async function login(passportUser) {
  if (!passportUser) throw ApiError.unauthorized("Unauthorized");

  const accessToken = tokenService.signAccessToken(passportUser);
  const refreshToken = tokenService.signRefreshToken(passportUser);

  const decoded = tokenService.verifyRefreshToken(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await RefreshToken.create({
    userId: passportUser.id,
    tokenHash: tokenService.hashRefreshToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken, user: sanitizeUser(passportUser) };
}

async function refresh(rawRefreshToken) {
  if (!rawRefreshToken) throw ApiError.unauthorized("Missing refresh token");

  let payload;
  try {
    payload = tokenService.verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }
  if (payload.type !== "refresh")
    throw ApiError.unauthorized("Invalid refresh token type");

  const userId = Number(payload.sub);
  if (!userId) throw ApiError.unauthorized("Invalid token subject");

  const tokenHash = tokenService.hashRefreshToken(rawRefreshToken);

  const tokenRow = await RefreshToken.findOne({
    where: {
      tokenHash,
      revokedAt: { [Op.is]: null },
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!tokenRow) throw ApiError.unauthorized("Refresh token revoked/expired");
  if (Number(tokenRow.userId) !== userId)
    throw ApiError.unauthorized("Refresh token mismatch");

  // rotate: revoke old
  tokenRow.revokedAt = new Date();
  await tokenRow.save();

  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "name", "role"],
  });
  if (!user) throw ApiError.unauthorized("User not found");

  const safeUser = user.toJSON();

  const accessToken = tokenService.signAccessToken(safeUser);
  const refreshToken = tokenService.signRefreshToken(safeUser);

  const decoded = tokenService.verifyRefreshToken(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await RefreshToken.create({
    userId: safeUser.id,
    tokenHash: tokenService.hashRefreshToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken, user: sanitizeUser(safeUser) };
}

async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = tokenService.hashRefreshToken(rawRefreshToken);
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { tokenHash, revokedAt: { [Op.is]: null } } }
  );
}

module.exports = { register, login, refresh, logout };
