const { ApiError } = require("../utils/apiError");

function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized("Unauthorized"));
  if (req.user.role !== "ADMIN") return next(ApiError.forbidden("Admin only"));
  next();
}

module.exports = { requireAdmin };
