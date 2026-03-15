const { User } = require('../models');
const appConfig = require('../config/app.config');
module.exports = async (req, res, next) => {
  let user = await User.findOne({ where: { openid: appConfig.mockUserOpenid } });
  if (!user) {
    user = await User.create({ openid: appConfig.mockUserOpenid, nickname: appConfig.mockUserNickname, status: 1 });
  }
  req.user = user;
  next();
};
