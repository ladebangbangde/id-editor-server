const { request } = require('../../utils/request');

Page({
  data: {
    imageId: '',
    hdUrl: '',
    priceCents: 990,
    displayPrice: '9.90',
    paid: false,
    statusText: '未支付',
    loading: false
  },

  onLoad(options) {
    const priceCents = Number(options.priceCents || 990);
    this.setData({
      imageId: options.imageId,
      hdUrl: decodeURIComponent(options.hdUrl || ''),
      priceCents,
      displayPrice: (priceCents / 100).toFixed(2)
    });
  },

  async createOrder() {
    this.setData({ loading: true });
    wx.showLoading({ title: '创建订单' });
    try {
      const data = await request({
        url: '/api/orders',
        method: 'POST',
        data: {
          imageId: Number(this.data.imageId),
          amountCents: this.data.priceCents,
          currency: 'CNY'
        }
      });

      const paid = data.paymentStatus === 'paid';
      this.setData({
        paid,
        statusText: paid ? '已支付' : '待支付（mock）'
      });

      wx.showToast({
        title: paid ? '支付成功' : '请完成支付',
        icon: 'none'
      });
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  downloadHd() {
    wx.showModal({
      title: '高清图地址',
      content: this.data.hdUrl,
      showCancel: false
    });
  }
});
