const { ApiError } = require("../utils/apiError");

const requireRole = (role) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized("Unauthorized"));
  if (req.user.role !== role) return next(ApiError.forbidden("Forbidden"));
  next();
};

module.exports = { requireRole };
