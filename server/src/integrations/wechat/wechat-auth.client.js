const appConfig = require('../../config/app.config');
const AppError = require('../../utils/app-error');

const WECHAT_CODE2SESSION_URL = 'https://api.weixin.qq.com/sns/jscode2session';

function getWechatAuthConfig() {
  if (!appConfig.wechatAppId) {
    throw new AppError('微信登录配置缺失: WECHAT_APPID 未配置', 400, null, 9007);
  }

  if (!appConfig.wechatSecret) {
    throw new AppError('微信登录配置缺失: WECHAT_SECRET 未配置', 400, null, 9008);
  }

  return {
    appId: appConfig.wechatAppId,
    secret: appConfig.wechatSecret
  };
}

async function code2Session(code) {
  const { appId, secret } = getWechatAuthConfig();
  const url = new URL(WECHAT_CODE2SESSION_URL);
  url.search = new URLSearchParams({
    appid: appId,
    secret,
    js_code: code,
    grant_type: 'authorization_code'
  }).toString();

  let response;
  try {
    response = await fetch(url);
  } catch (_error) {
    throw new AppError('调用微信 code2Session 失败', 502, null, 9009);
  }

  if (!response.ok) {
    throw new AppError(`微信 code2Session 请求失败: HTTP ${response.status}`, 502, null, 9009);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (_error) {
    throw new AppError('微信 code2Session 返回了无效响应', 502, null, 9009);
  }

  if (payload.errcode) {
    const detail = payload.errmsg ? `: ${payload.errmsg}` : '';
    throw new AppError(`微信 code2Session 返回错误(${payload.errcode})${detail}`, 401, payload, 9010);
  }

  if (!payload.openid) {
    throw new AppError('微信 code2Session 未返回 openid', 502, payload, 9010);
  }

  return {
    openid: payload.openid,
    sessionKey: payload.session_key,
    unionid: payload.unionid || null
  };
}

module.exports = {
  code2Session,
  getWechatAuthConfig
};
