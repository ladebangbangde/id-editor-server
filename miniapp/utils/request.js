const BASE_URL = 'http://127.0.0.1:3000';

function request({ url, method = 'GET', data = {}, header = {} }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data);
          return;
        }

        const message = body.message || `请求失败(${res.statusCode})`;
        reject(new Error(message));
      },
      fail: (err) => reject(err)
    });
  });
}

function uploadFile({ filePath, name = 'file' }) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${BASE_URL}/api/upload`,
      filePath,
      name,
      success: (res) => {
        try {
          const body = JSON.parse(res.data || '{}');
          if (body.code === 0) {
            resolve(body.data);
            return;
          }
          reject(new Error(body.message || '上传失败'));
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => reject(err)
    });
  });
}

module.exports = {
  BASE_URL,
  request,
  uploadFile
};
