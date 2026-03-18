const { Op } = require('sequelize');
const { SpecCategory, SpecTemplate } = require('../models');
const AppError = require('../utils/app-error');

const parsePositiveInt = (value, defaultValue) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
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

const toTemplateDto = (template) => ({
  id: template.id,
  category: template.category_key,
  sceneKey: template.scene_key,
  name: template.name,
  scene: template.scene,
  tip: template.tip || template.scene,
  pixel: template.pixel_text,
  pixelWidth: Number(template.pixel_width),
  pixelHeight: Number(template.pixel_height),
  widthMm: Number(template.width_mm),
  heightMm: Number(template.height_mm),
  backgroundOptions: normalizeArray(template.background_options),
  tags: normalizeArray(template.tags),
  hot: Boolean(template.is_hot),
  sort: Number(template.sort),
  actionPath: template.action_path
});

module.exports = {
  async categories() {
    const list = await SpecCategory.findAll({
      where: { is_active: true },
      attributes: ['key', 'name', 'sort'],
      order: [
        ['sort', 'ASC'],
        ['id', 'ASC']
      ]
    });

    return list.map((item) => ({
      key: item.key,
      name: item.name,
      sort: Number(item.sort)
    }));
  },

  async list({ category, page, pageSize }) {
    const currentPage = parsePositiveInt(page, 1);
    const currentPageSize = parsePositiveInt(pageSize, 20);
    const where = { is_active: true };

    if (category) {
      const categoryItem = await SpecCategory.findOne({ where: { key: category, is_active: true } });
      if (!categoryItem) {
        throw new AppError(`Invalid category: ${category}`, 400, { category });
      }
      where.category_key = category;
    }

    const { count, rows } = await SpecTemplate.findAndCountAll({
      where,
      order: [
        ['is_hot', 'DESC'],
        ['sort', 'ASC'],
        ['id', 'ASC']
      ],
      offset: (currentPage - 1) * currentPageSize,
      limit: currentPageSize
    });

    return {
      list: rows.map(toTemplateDto),
      total: count,
      page: currentPage,
      pageSize: currentPageSize
    };
  },

  async detail(id) {
    const template = await SpecTemplate.findOne({
      where: {
        id,
        is_active: true,
        category_key: { [Op.ne]: null }
      }
    });

    if (!template) {
      throw new AppError('Spec template not found', 404, { id });
    }

    return toTemplateDto(template);
  }
};
