const { Op } = require('sequelize');
const { SpecCategory, SpecTemplate } = require('../models');
const AppError = require('../utils/app-error');
const {
  getSpecCategories,
  getSpecTemplateById,
  getSpecTemplatesByCategory
} = require('../constants/spec-data');

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

const isMissingSpecTableError = (error) =>
  error && error.name === 'SequelizeDatabaseError' && error.parent && error.parent.code === 'ER_NO_SUCH_TABLE';

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

const toFallbackTemplateDto = (template) => ({
  id: template.id,
  category: template.category,
  sceneKey: template.sceneKey,
  name: template.name,
  scene: template.scene,
  tip: template.tip || template.scene,
  pixel: template.pixel,
  pixelWidth: template.pixelWidth,
  pixelHeight: template.pixelHeight,
  widthMm: template.widthMm,
  heightMm: template.heightMm,
  backgroundOptions: template.backgroundOptions || [],
  tags: template.tags || [],
  hot: Boolean(template.hot),
  sort: Number(template.sort),
  actionPath: template.actionPath
});

const ensureCategoryExists = async (category) => {
  const categoryItem = await SpecCategory.findOne({ where: { key: category, is_active: true } });
  if (!categoryItem) {
    throw new AppError(`Invalid category: ${category}`, 400, { category });
  }
};

const ensureFallbackCategoryExists = (category) => {
  const categoryItem = getSpecCategories().find((item) => item.key === category);
  if (!categoryItem) {
    throw new AppError(`Invalid category: ${category}`, 400, { category });
  }
};

module.exports = {
  async categories() {
    try {
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
    } catch (error) {
      if (!isMissingSpecTableError(error)) {
        throw error;
      }

      return getSpecCategories();
    }
  },

  async list({ category, page, pageSize }) {
    const currentPage = parsePositiveInt(page, 1);
    const currentPageSize = parsePositiveInt(pageSize, 20);
    const where = { is_active: true };

    try {
      if (category) {
        await ensureCategoryExists(category);
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
    } catch (error) {
      if (!isMissingSpecTableError(error)) {
        throw error;
      }

      if (category) {
        ensureFallbackCategoryExists(category);
      }

      const fallbackList = getSpecTemplatesByCategory(category).map(toFallbackTemplateDto);
      const offset = (currentPage - 1) * currentPageSize;

      return {
        list: fallbackList.slice(offset, offset + currentPageSize),
        total: fallbackList.length,
        page: currentPage,
        pageSize: currentPageSize
      };
    }
  },

  async detail(id) {
    try {
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
    } catch (error) {
      if (!isMissingSpecTableError(error)) {
        throw error;
      }

      const template = getSpecTemplateById(id);
      if (!template) {
        throw new AppError('Spec template not found', 404, { id });
      }

      return toFallbackTemplateDto(template);
    }
  }
};
