const { ApiError } = require("../utils/apiError");

function requirePostOwnerOrAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized("Unauthorized"));
  if (!req.post) return next(ApiError.badRequest("Missing post in request"));

  const isOwner = Number(req.post.userId) === Number(req.user.id);
  const isAdmin = req.user.role === "ADMIN";

  if (!isOwner && !isAdmin) return next(ApiError.forbidden("Forbidden"));
  next();
}

module.exports = { requirePostOwnerOrAdmin };
