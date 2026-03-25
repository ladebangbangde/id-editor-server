const appConfig = require('../config/app.config');

function pickHeader(req, name) {
  const value = req?.headers?.[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

function getRequestBaseUrl(req) {
  if (!req) return null;

  const forwardedProto = String(pickHeader(req, 'x-forwarded-proto') || '').split(',')[0].trim();
  const forwardedHost = String(pickHeader(req, 'x-forwarded-host') || '').split(',')[0].trim();
  const host = forwardedHost || String(pickHeader(req, 'host') || '').trim();
  if (!host) return null;

  const proto = forwardedProto || (req.protocol === 'https' ? 'https' : 'http');
  return `${proto}://${host}`;
}

function isLocalLikeHostname(hostname) {
  const value = String(hostname || '').toLowerCase();
  if (!value) return true;
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(value)) return true;
  if (value.endsWith('.local')) return true;
  if (/^10\./.test(value)) return true;
  if (/^192\.168\./.test(value)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) return true;
  return false;
}

function getPublicBaseUrl(req) {
  return getRequestBaseUrl(req) || appConfig.publicBaseUrl || appConfig.baseUrl;
}

function toAbsolutePublicUrl(url, req) {
  if (!url) return null;
  const baseUrl = getPublicBaseUrl(req);
  const value = String(url).trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (isLocalLikeHostname(parsed.hostname) && baseUrl) {
        return new URL(`${parsed.pathname}${parsed.search || ''}${parsed.hash || ''}`, `${baseUrl}/`).toString();
      }
      return parsed.toString();
    } catch (_error) {
      return value;
    }
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return new URL(normalizedPath, `${baseUrl}/`).toString();
}

module.exports = {
  getPublicBaseUrl,
  toAbsolutePublicUrl,
  isLocalLikeHostname
};
