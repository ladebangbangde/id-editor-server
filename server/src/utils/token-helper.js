const jwt = require('jsonwebtoken');
const appConfig = require('../config/app.config');
const signUserToken = (payload) => jwt.sign(payload, appConfig.jwtSecret, { expiresIn: appConfig.jwtExpiresIn });
const signAdminToken = (payload) => jwt.sign(payload, appConfig.jwtSecret, { expiresIn: appConfig.adminJwtExpiresIn });
const verifyToken = (token) => jwt.verify(token, appConfig.jwtSecret);
module.exports = { signUserToken, signAdminToken, verifyToken };
