class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
  static badRequest(msg = "Bad request", details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = "Unauthorized", details) {
    return new ApiError(401, msg, details);
  }
  static forbidden(msg = "Forbidden", details) {
    return new ApiError(403, msg, details);
  }
}
module.exports = { ApiError };
