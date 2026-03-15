function success(res, data = {}, message = 'OK', code = 200) { return res.status(code).json({ success: true, message, data }); }
function fail(res, message = 'Error message', data = null, code = 400) { return res.status(code).json({ success: false, message, data }); }
module.exports = { success, fail };
