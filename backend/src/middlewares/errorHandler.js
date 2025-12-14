const { ApiError } = require("../utils/apiError");

function errorHandler(err, _req, res, _next) {
  const status = err instanceof ApiError ? err.statusCode : 500;
  if (process.env.NODE_ENV !== "production") console.error(err);
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err instanceof ApiError ? err.details : undefined,
  });
}

module.exports = { errorHandler };
