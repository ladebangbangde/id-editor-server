const { SpecTemplate } = require('../models');
const {
  getHomeTabs,
  getHomeTab,
  getSpecTemplatesByCategory,
  toHomeTemplate
} = require('../constants/spec-data');

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
  quickEntries: []
};

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

const isMissingSpecTableError = (error) =>
  error && error.name === 'SequelizeDatabaseError' && error.parent && error.parent.code === 'ER_NO_SUCH_TABLE';

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
    const matchedTab = getHomeTab(category);
    if (!matchedTab) {
      return {
        tabs: getHomeTabs(),
        templates: []
      };
    }

    try {
      const templates = await SpecTemplate.findAll({
        where: {
          category_key: matchedTab.specCategoryKey,
          is_active: true
        },
        order: [
          ['is_hot', 'DESC'],
          ['sort', 'ASC'],
          ['id', 'ASC']
        ]
      });

      return {
        tabs: getHomeTabs(),
        templates: templates.map(toHomeTemplateDto)
      };
    } catch (error) {
      if (!isMissingSpecTableError(error)) {
        throw error;
      }

      return {
        tabs: getHomeTabs(),
        templates: getSpecTemplatesByCategory(matchedTab.specCategoryKey).map(toHomeTemplate)
      };
    }
  }
};
