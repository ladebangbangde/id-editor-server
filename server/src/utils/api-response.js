function success(res, data = {}, message = 'OK', code = 200) {
  return res.status(code).json({ success: true, code: 0, message, data });
}

function fail(res, message = 'Error message', data = null, statusCode = 400, businessCode = null) {
  return res.status(statusCode).json({ success: false, code: businessCode || statusCode, message, data });
}

module.exports = { success, fail };
