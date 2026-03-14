const { request, uploadFile } = require('../../utils/request');

Page({
  data: {
    localImagePath: '',
    imageId: null,
    bgColor: 'blue',
    sizeOptions: [
      { value: 'one_inch', label: '1寸' },
      { value: 'two_inch', label: '2寸' },
      { value: 'passport', label: '护照' },
      { value: 'visa', label: '签证' }
    ],
    sizeIndex: 0,
    bgOptions: [
      { value: 'blue', label: '蓝底' },
      { value: 'white', label: '白底' },
      { value: 'red', label: '红底' }
    ],
    loading: false
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (res) => {
        const filePath = res.tempFiles?.[0]?.tempFilePath;
        if (!filePath) return;

        this.setData({ localImagePath: filePath });
        wx.showLoading({ title: '上传中' });
        try {
          const data = await uploadFile({ filePath });
          this.setData({ imageId: data.imageId });
        } catch (error) {
          wx.showToast({ title: error.message, icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  onBgChange(e) {
    this.setData({ bgColor: e.detail.value });
  },

  onSizeChange(e) {
    this.setData({ sizeIndex: Number(e.detail.value) });
  },

  async handleGenerate() {
    const { imageId, bgColor, sizeOptions, sizeIndex } = this.data;
    if (!imageId) {
      wx.showToast({ title: '请先上传图片', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '生成中' });
    try {
      const sizeType = sizeOptions[sizeIndex].value;
      const data = await request({
        url: `/api/images/${imageId}/generate`,
        method: 'POST',
        data: { bgColor, sizeType }
      });

      wx.navigateTo({
        url: `/pages/preview/index?imageId=${imageId}&previewUrl=${encodeURIComponent(data.previewUrl)}&hdUrl=${encodeURIComponent(data.hdUrl)}&priceCents=${data.priceCents}`
      });
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  }
});
