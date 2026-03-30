const localStorageProvider = require('./local-storage.provider');

module.exports = {
  // 预留未来 OSS/COS 扩展点：后续根据配置切换 provider 即可。
  provider: localStorageProvider,

  deleteByUrl(url) {
    return this.provider.deleteByUrl(url);
  }
};
