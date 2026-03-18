const HOME_CONFIG = {
  mainCards: [
    {
      key: 'photo',
      title: '拍摄证件照',
      subtitle: '制作标准证件照',
      icon: 'camera',
      actionPath: '/pages/photo/index'
    },
    {
      key: 'bg',
      title: '一键换底色',
      subtitle: '智能抠图换底色',
      icon: 'palette',
      actionPath: '/pages/change-bg/index'
    }
  ],
  quickEntries: [
    {
      key: 'custom',
      title: '自定义像素',
      icon: 'custom',
      actionPath: '/pages/custom-size/index'
    },
    {
      key: 'dress',
      title: '智能换正装',
      icon: 'dress',
      actionPath: '/pages/change-dress/index'
    },
    {
      key: 'vip',
      title: '高端定制',
      icon: 'vip',
      actionPath: '/pages/premium/index'
    },
    {
      key: 'receipt',
      title: '回执办理',
      icon: 'receipt',
      actionPath: '/pages/receipt/index'
    }
  ]
};

module.exports = {
  config() {
    return HOME_CONFIG;
  }
};
