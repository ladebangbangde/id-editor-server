class AppError extends Error {
  constructor(message, statusCode = 400, data = null, businessCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.businessCode = businessCode;
  }
}
module.exports = AppError;
