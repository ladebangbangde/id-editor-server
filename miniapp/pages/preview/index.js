Page({
  data: {
    imageId: '',
    previewUrl: '',
    hdUrl: '',
    priceCents: 990,
    displayPrice: '9.90'
  },

  onLoad(options) {
    const priceCents = Number(options.priceCents || 990);
    this.setData({
      imageId: options.imageId,
      previewUrl: decodeURIComponent(options.previewUrl || ''),
      hdUrl: decodeURIComponent(options.hdUrl || ''),
      priceCents,
      displayPrice: (priceCents / 100).toFixed(2)
    });
  },

  goOrder() {
    const { imageId, hdUrl, priceCents } = this.data;
    wx.navigateTo({
      url: `/pages/order/index?imageId=${imageId}&hdUrl=${encodeURIComponent(hdUrl)}&priceCents=${priceCents}`
    });
  }
});
