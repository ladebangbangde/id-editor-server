module.exports = {
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
  // 统一共享目录：原图在 original，处理结果在 processed，临时文件在 temp。
  FOLDERS: { ORIGINAL: 'original', PREVIEW: 'processed', HD: 'processed', PRINT: 'processed', TEMP: 'temp', PROCESSED: 'processed' }
};
