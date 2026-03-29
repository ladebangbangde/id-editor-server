const STAGE_TEXT = {
  received: '已接收照片',
  checking: '正在检查照片',
  adjusting: '正在整理背景与尺寸',
  enhancing: '正在优化照片效果',
  finalizing: '正在生成最终结果',
  success: '制作完成',
  failed: '处理失败',
  timeout: '处理时间稍长，请稍后重试'
};

const STAGE_PROGRESS = {
  received: 5,
  checking: 18,
  adjusting: 46,
  enhancing: 72,
  finalizing: 90,
  success: 100,
  failed: 100,
  timeout: 100
};

module.exports = {
  STAGE_TEXT,
  STAGE_PROGRESS
};
