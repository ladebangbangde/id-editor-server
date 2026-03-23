const appConfig = require('../../config/app.config');
const AppError = require('../../utils/app-error');

const WECHAT_CODE2SESSION_URL = 'https://api.weixin.qq.com/sns/jscode2session';

async function code2Session(code) {
  if (!appConfig.wechatAppId || !appConfig.wechatSecret) {
    throw new AppError('微信登录暂不可用', 500, null, 9005);
  }

  const url = new URL(WECHAT_CODE2SESSION_URL);
  url.search = new URLSearchParams({
    appid: appConfig.wechatAppId,
    secret: appConfig.wechatSecret,
    js_code: code,
    grant_type: 'authorization_code'
  }).toString();

  let response;
  try {
    response = await fetch(url);
  } catch (_error) {
    throw new AppError('微信登录失败', 502, null, 9004);
  }

  if (!response.ok) {
    throw new AppError('微信登录失败', 502, null, 9004);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (_error) {
    throw new AppError('微信登录失败', 502, null, 9004);
  }

  if (payload.errcode || !payload.openid) {
    throw new AppError('微信登录失败', 401, null, 9004);
  }

  return {
    openid: payload.openid,
    sessionKey: payload.session_key,
    unionid: payload.unionid || null
  };
}

module.exports = { code2Session };
