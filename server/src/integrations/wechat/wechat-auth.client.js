const appConfig = require('../../config/app.config');
const AppError = require('../../utils/app-error');
const logger = require('../../utils/logger');

const WECHAT_CODE2SESSION_URL = 'https://api.weixin.qq.com/sns/jscode2session';

function getWechatAuthConfig() {
  if (!appConfig.wechatAppId) {
    logger.error('wechat auth config missing', {
      field: 'WECHAT_APPID',
      exists: false,
      message: '微信登录配置缺失: WECHAT_APPID 未配置'
    });
    throw new AppError('微信登录配置缺失: WECHAT_APPID 未配置', 400, null, 9007);
  }

  if (!appConfig.wechatSecret) {
    logger.error('wechat auth config missing', {
      field: 'WECHAT_SECRET',
      exists: false,
      message: '微信登录配置缺失: WECHAT_SECRET 未配置'
    });
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
  } catch (error) {
    logger.error('wechat code2Session request failed', {
      code,
      message: error.message || '调用微信 code2Session 失败'
    });
    throw new AppError('调用微信 code2Session 失败', 502, null, 9009);
  }

  if (!response.ok) {
    logger.error('wechat code2Session http error', {
      code,
      status: response.status
    });
    throw new AppError(`微信 code2Session 请求失败: HTTP ${response.status}`, 502, null, 9009);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    logger.error('wechat code2Session invalid json', {
      code,
      message: error.message || '微信 code2Session 返回了无效响应'
    });
    throw new AppError('微信 code2Session 返回了无效响应', 502, null, 9009);
  }

  if (payload.errcode) {
    const detail = payload.errmsg ? `: ${payload.errmsg}` : '';
    logger.warn('wechat code2Session business error', {
      code,
      errcode: payload.errcode,
      errmsg: payload.errmsg || '',
      payload
    });
    throw new AppError(`微信 code2Session 返回错误(${payload.errcode})${detail}`, 401, payload, 9010);
  }

  if (!payload.openid) {
    logger.error('wechat code2Session missing openid', {
      code,
      payload
    });
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
