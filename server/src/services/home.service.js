const { SpecTemplate } = require('../models');

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

const HOME_TEMPLATE_TABS = [
  { key: 'popular', label: '热门尺寸', categoryKey: 'hot' },
  { key: 'general', label: '通用寸照', categoryKey: 'common' },
  { key: 'medical', label: '医药卫生', categoryKey: 'medical' },
  { key: 'language', label: '语言考试', categoryKey: 'language' },
  { key: 'civil', label: '公务考试', categoryKey: 'civil' },
  { key: 'degree', label: '学历考试', categoryKey: 'education' },
  { key: 'career', label: '职业资格', categoryKey: 'job' },
  { key: 'passport', label: '签证护照', categoryKey: 'passport' },
  { key: 'police', label: '公安证件', categoryKey: 'police' },
  { key: 'social', label: '社保民政', categoryKey: 'social' }
];

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  return [];
};

const toHomeTemplateDto = (template) => ({
  sceneKey: template.scene_key,
  name: template.name,
  pixelWidth: Number(template.pixel_width),
  pixelHeight: Number(template.pixel_height),
  hot: Boolean(template.is_hot),
  tip: template.tip || template.scene,
  tags: normalizeArray(template.tags)
});

module.exports = {
  config() {
    return HOME_CONFIG;
  },

  async templates(category = 'popular') {
    const matchedTab = HOME_TEMPLATE_TABS.find((tab) => tab.key === category);
    const templates = matchedTab
      ? await SpecTemplate.findAll({
          where: {
            category_key: matchedTab.categoryKey,
            is_active: true
          },
          order: [
            ['is_hot', 'DESC'],
            ['sort', 'ASC'],
            ['id', 'ASC']
          ]
        })
      : [];

    return {
      tabs: HOME_TEMPLATE_TABS.map(({ key, label }) => ({ key, label })),
      templates: templates.map(toHomeTemplateDto)
    };
  }
};
