function success(res, data = {}, message = 'ok') {
  return res.json({ code: 0, message, data });
}

function fail(res, message = 'error', code = 1, httpStatus = 400, data = null) {
  return res.status(httpStatus).json({ code, message, data });
}

module.exports = {
  success,
  fail
};
