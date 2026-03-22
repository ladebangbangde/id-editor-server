const appConfig = require('../config/app.config');

function normalizeAssetPath(url) {
  if (!url) return null;

  const value = String(url).trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  if (value.startsWith('uploads/')) return `/${value}`;

  return value;
}

function buildAbsoluteAssetUrl(url) {
  const normalized = normalizeAssetPath(url);
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;

  return new URL(normalized, `${appConfig.baseUrl}/`).toString();
}

module.exports = {
  normalizeAssetPath,
  buildAbsoluteAssetUrl
};
