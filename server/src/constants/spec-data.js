const HOME_TEMPLATE_TABS = [
  { key: 'popular', label: '热门尺寸', specCategoryKey: 'hot' },
  { key: 'general', label: '通用寸照', specCategoryKey: 'common' },
  { key: 'medical', label: '医药卫生', specCategoryKey: 'medical' },
  { key: 'language', label: '语言考试', specCategoryKey: 'language' },
  { key: 'civil', label: '公务考试', specCategoryKey: 'civil' },
  { key: 'degree', label: '学历考试', specCategoryKey: 'education' },
  { key: 'career', label: '职业资格', specCategoryKey: 'job' },
  { key: 'passport', label: '签证护照', specCategoryKey: 'passport' },
  { key: 'police', label: '公安证件', specCategoryKey: 'police' },
  { key: 'social', label: '社保民政', specCategoryKey: 'social' }
];

const SPEC_CATEGORIES = [
  { key: 'hot', name: '热门尺寸', sort: 1 },
  { key: 'common', name: '通用寸照', sort: 2 },
  { key: 'medical', name: '医药卫生', sort: 3 },
  { key: 'language', name: '语言考试', sort: 4 },
  { key: 'civil', name: '公务考试', sort: 5 },
  { key: 'education', name: '学历考试', sort: 6 },
  { key: 'job', name: '职业资格', sort: 7 },
  { key: 'passport', name: '签证护照', sort: 8 },
  { key: 'police', name: '公安证件', sort: 9 },
  { key: 'social', name: '社保民政', sort: 10 }
];

const SPEC_TEMPLATES = [
  { id: 'size_001', category: 'hot', sceneKey: 'one_inch', name: '一寸', scene: '常规证件照', tip: '适合常规证件办理与简历投递', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['白底', '蓝底', '红底'], tags: ['白底', '蓝底', '红底', '常用'], hot: true, sort: 1, actionPath: '/pages/spec-detail/index?id=size_001' },
  { id: 'size_002', category: 'hot', sceneKey: 'two_inch', name: '二寸', scene: '常规证件照', tip: '常用于报名表、证书与签证材料', pixel: '413×579PX', pixelWidth: 413, pixelHeight: 579, widthMm: 35, heightMm: 49, backgroundOptions: ['白底', '蓝底', '红底'], tags: ['白底', '蓝底', '红底', '常用'], hot: true, sort: 2, actionPath: '/pages/spec-detail/index?id=size_002' },
  { id: 'size_003', category: 'hot', sceneKey: 'small_one_inch', name: '小一寸', scene: '常规证件照', tip: '适合学生证、工作证等常见场景', pixel: '260×378PX', pixelWidth: 260, pixelHeight: 378, widthMm: 22, heightMm: 32, backgroundOptions: ['白底', '蓝底', '红底'], tags: ['白底', '蓝底', '红底', '热门'], hot: true, sort: 3, actionPath: '/pages/spec-detail/index?id=size_003' },
  { id: 'size_004', category: 'hot', sceneKey: 'small_two_inch', name: '小二寸', scene: '常规证件照', tip: '适合考试报名与资格申请', pixel: '413×531PX', pixelWidth: 413, pixelHeight: 531, widthMm: 35, heightMm: 45, backgroundOptions: ['白底', '蓝底', '红底'], tags: ['白底', '蓝底', '红底', '热门'], hot: true, sort: 4, actionPath: '/pages/spec-detail/index?id=size_004' },
  { id: 'size_005', category: 'hot', sceneKey: 'large_two_inch', name: '大二寸', scene: '常规证件照', tip: '适合部分资格证书与出入境材料', pixel: '413×626PX', pixelWidth: 413, pixelHeight: 626, widthMm: 35, heightMm: 53, backgroundOptions: ['白底', '蓝底', '红底'], tags: ['白底', '蓝底', '红底', '推荐'], hot: true, sort: 5, actionPath: '/pages/spec-detail/index?id=size_005' },
  { id: 'size_006', category: 'common', sceneKey: 'one_inch', name: '一寸', scene: '通用报名照', tip: '适合通用报名与证件办理', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['红底', '蓝底', '白底'], tags: ['红底', '蓝底', '白底', '通用'], hot: false, sort: 1, actionPath: '/pages/spec-detail/index?id=size_006' },
  { id: 'size_007', category: 'common', sceneKey: 'two_inch', name: '二寸', scene: '通用报名照', tip: '适合纸质报名表与资格申请', pixel: '413×579PX', pixelWidth: 413, pixelHeight: 579, widthMm: 35, heightMm: 49, backgroundOptions: ['红底', '蓝底', '白底'], tags: ['红底', '蓝底', '白底', '通用'], hot: false, sort: 2, actionPath: '/pages/spec-detail/index?id=size_007' },
  { id: 'size_008', category: 'common', sceneKey: 'small_one_inch', name: '小一寸', scene: '通用报名照', tip: '适合校园与单位常见尺寸', pixel: '260×378PX', pixelWidth: 260, pixelHeight: 378, widthMm: 22, heightMm: 32, backgroundOptions: ['红底', '蓝底', '白底'], tags: ['红底', '蓝底', '白底', '通用'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_008' },
  { id: 'size_009', category: 'common', sceneKey: 'small_two_inch', name: '小二寸', scene: '通用报名照', tip: '适合考试报名及档案提交', pixel: '413×531PX', pixelWidth: 413, pixelHeight: 531, widthMm: 35, heightMm: 45, backgroundOptions: ['红底', '蓝底', '白底'], tags: ['红底', '蓝底', '白底', '通用'], hot: false, sort: 4, actionPath: '/pages/spec-detail/index?id=size_009' },
  { id: 'size_010', category: 'common', sceneKey: 'large_one_inch', name: '大一寸', scene: '通用报名照', tip: '适合部分资格证和档案材料', pixel: '390×567PX', pixelWidth: 390, pixelHeight: 567, widthMm: 33, heightMm: 48, backgroundOptions: ['红底', '蓝底', '白底'], tags: ['红底', '蓝底', '白底', '通用'], hot: false, sort: 5, actionPath: '/pages/spec-detail/index?id=size_010' },
  { id: 'size_011', category: 'common', sceneKey: 'large_two_inch', name: '大二寸', scene: '通用报名照', tip: '适合签证、资格申报等场景', pixel: '413×626PX', pixelWidth: 413, pixelHeight: 626, widthMm: 35, heightMm: 53, backgroundOptions: ['红底', '蓝底', '白底'], tags: ['红底', '蓝底', '白底', '通用'], hot: false, sort: 6, actionPath: '/pages/spec-detail/index?id=size_011' },
  { id: 'size_012', category: 'medical', sceneKey: 'health_certificate', name: '健康证', scene: '健康证办理照', tip: '健康证办理与体检建档常用规格', pixel: '358×441PX', pixelWidth: 358, pixelHeight: 441, widthMm: 30, heightMm: 37, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '医药卫生'], hot: false, sort: 1, actionPath: '/pages/spec-detail/index?id=size_012' },
  { id: 'size_013', category: 'medical', sceneKey: 'licensed_pharmacist_exam', name: '执业药师报名照', scene: '执业药师考试报名', tip: '执业药师考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '报名'], hot: false, sort: 2, actionPath: '/pages/spec-detail/index?id=size_013' },
  { id: 'size_014', category: 'medical', sceneKey: 'nurse_exam', name: '护士/医护类报名照', scene: '护士执业或医护报名', tip: '护士执业与医护类考试报名常用规格', pixel: '413×531PX', pixelWidth: 413, pixelHeight: 531, widthMm: 35, heightMm: 45, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '医护'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_014' },
  { id: 'size_015', category: 'language', sceneKey: 'ielts_exam', name: '雅思', scene: 'IELTS 报名照片', tip: '雅思考试报名常用规格', pixel: '389×567PX', pixelWidth: 389, pixelHeight: 567, widthMm: 33, heightMm: 48, backgroundOptions: ['白底'], tags: ['白底', '考试'], hot: false, sort: 1, actionPath: '/pages/spec-detail/index?id=size_015' },
  { id: 'size_016', category: 'language', sceneKey: 'toefl_exam', name: '托福', scene: 'TOEFL 报名照片', tip: '托福考试报名常用规格', pixel: '390×567PX', pixelWidth: 390, pixelHeight: 567, widthMm: 33, heightMm: 48, backgroundOptions: ['白底'], tags: ['白底', '考试'], hot: false, sort: 2, actionPath: '/pages/spec-detail/index?id=size_016' },
  { id: 'size_017', category: 'language', sceneKey: 'mandarin_exam', name: '普通话考试', scene: '普通话水平测试', tip: '普通话等级考试常用规格', pixel: '390×567PX', pixelWidth: 390, pixelHeight: 567, widthMm: 33, heightMm: 48, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '考试'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_017' },
  { id: 'size_018', category: 'language', sceneKey: 'english_level_exam', name: '英语等级考试', scene: '英语等级报名照', tip: '英语等级考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '考试'], hot: false, sort: 4, actionPath: '/pages/spec-detail/index?id=size_018' },
  { id: 'size_019', category: 'civil', sceneKey: 'national_civil_service_exam', name: '国考', scene: '国家公务员考试', tip: '国家公务员考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '公务考试'], hot: false, sort: 1, actionPath: '/pages/spec-detail/index?id=size_019' },
  { id: 'size_020', category: 'civil', sceneKey: 'provincial_civil_service_exam', name: '省考', scene: '省级公务员考试', tip: '省级公务员考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '热门', '考试报名'], hot: true, sort: 2, actionPath: '/pages/spec-detail/index?id=size_020' },
  { id: 'size_021', category: 'civil', sceneKey: 'public_institution_exam', name: '事业单位报名', scene: '事业单位公开招聘', tip: '事业单位公开招聘报名常用规格', pixel: '413×531PX', pixelWidth: 413, pixelHeight: 531, widthMm: 35, heightMm: 45, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '报名'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_021' },
  { id: 'size_022', category: 'civil', sceneKey: 'three_supports_exam', name: '三支一扶', scene: '三支一扶计划报名', tip: '三支一扶计划报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '报名'], hot: false, sort: 4, actionPath: '/pages/spec-detail/index?id=size_022' },
  { id: 'size_023', category: 'education', sceneKey: 'postgraduate_exam', name: '研究生考试', scene: '全国硕士研究生招生考试', tip: '研究生考试报名常用规格', pixel: '413×531PX', pixelWidth: 413, pixelHeight: 531, widthMm: 35, heightMm: 45, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '学历考试'], hot: false, sort: 1, actionPath: '/pages/spec-detail/index?id=size_023' },
  { id: 'size_024', category: 'education', sceneKey: 'adult_college_exam', name: '成人高考', scene: '成人高考报名', tip: '成人高考报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '学历考试'], hot: false, sort: 2, actionPath: '/pages/spec-detail/index?id=size_024' },
  { id: 'size_025', category: 'education', sceneKey: 'self_taught_exam', name: '自考', scene: '自学考试报名', tip: '高等教育自学考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '学历考试'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_025' },
  { id: 'size_026', category: 'education', sceneKey: 'top_up_exam', name: '专升本', scene: '专升本报名', tip: '专升本报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '学历考试'], hot: false, sort: 4, actionPath: '/pages/spec-detail/index?id=size_026' },
  { id: 'size_027', category: 'job', sceneKey: 'teacher_exam', name: '教资报名（请选白底）', scene: '教师资格证报名', tip: '教师资格考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['白底'], tags: ['白底', '热门', '考试报名'], hot: true, sort: 1, actionPath: '/pages/spec-detail/index?id=size_027' },
  { id: 'size_028', category: 'job', sceneKey: 'first_constructor_exam', name: '一建报名', scene: '一级建造师考试报名', tip: '一级建造师考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '职业资格'], hot: false, sort: 2, actionPath: '/pages/spec-detail/index?id=size_028' },
  { id: 'size_029', category: 'job', sceneKey: 'second_constructor_exam', name: '二建报名', scene: '二级建造师考试报名', tip: '二级建造师考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '职业资格'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_029' },
  { id: 'size_030', category: 'job', sceneKey: 'accounting_exam', name: '会计考试', scene: '会计类资格考试报名', tip: '会计类资格考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '职业资格'], hot: false, sort: 4, actionPath: '/pages/spec-detail/index?id=size_030' },
  { id: 'size_031', category: 'job', sceneKey: 'computer_exam', name: '计算机考试', scene: '计算机等级考试报名', tip: '计算机等级考试报名常用规格', pixel: '295×413PX', pixelWidth: 295, pixelHeight: 413, widthMm: 25, heightMm: 35, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '热门', '考试报名'], hot: true, sort: 5, actionPath: '/pages/spec-detail/index?id=size_031' },
  { id: 'size_032', category: 'passport', sceneKey: 'passport', name: '护照', scene: '中国护照照片', tip: '护照办理常用规格', pixel: '390×567PX', pixelWidth: 390, pixelHeight: 567, widthMm: 33, heightMm: 48, backgroundOptions: ['白底'], tags: ['白底', '出入境'], hot: true, sort: 1, actionPath: '/pages/spec-detail/index?id=size_032' },
  { id: 'size_033', category: 'passport', sceneKey: 'hk_macau_pass', name: '港澳通行证', scene: '港澳居民来往内地通行证', tip: '港澳通行证办理常用规格', pixel: '390×567PX', pixelWidth: 390, pixelHeight: 567, widthMm: 33, heightMm: 48, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '出入境'], hot: false, sort: 2, actionPath: '/pages/spec-detail/index?id=size_033' },
  { id: 'size_034', category: 'passport', sceneKey: 'taiwan_pass', name: '台湾通行证', scene: '大陆居民往来台湾通行证', tip: '台湾通行证办理常用规格', pixel: '390×567PX', pixelWidth: 390, pixelHeight: 567, widthMm: 33, heightMm: 48, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '出入境'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_034' },
  { id: 'size_035', category: 'passport', sceneKey: 'visa', name: '签证照', scene: '常见签证办理照片', tip: '常见签证办理常用规格', pixel: '413×531PX', pixelWidth: 413, pixelHeight: 531, widthMm: 35, heightMm: 45, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '签证'], hot: false, sort: 4, actionPath: '/pages/spec-detail/index?id=size_035' },
  { id: 'size_036', category: 'police', sceneKey: 'id_card', name: '身份证', scene: '身份证办理照', tip: '身份证办理常用规格', pixel: '358×441PX', pixelWidth: 358, pixelHeight: 441, widthMm: 30, heightMm: 37, backgroundOptions: ['白底'], tags: ['白底', '公安证件'], hot: false, sort: 1, actionPath: '/pages/spec-detail/index?id=size_036' },
  { id: 'size_037', category: 'police', sceneKey: 'driver_license', name: '驾驶证', scene: '驾驶证证件照', tip: '驾驶证办理常用规格', pixel: '260×378PX', pixelWidth: 260, pixelHeight: 378, widthMm: 22, heightMm: 32, backgroundOptions: ['白底'], tags: ['白底', '热门', '证件办理'], hot: true, sort: 2, actionPath: '/pages/spec-detail/index?id=size_037' },
  { id: 'size_038', category: 'police', sceneKey: 'residence_permit', name: '居住证', scene: '居住证办理照', tip: '居住证办理常用规格', pixel: '358×441PX', pixelWidth: 358, pixelHeight: 441, widthMm: 30, heightMm: 37, backgroundOptions: ['白底'], tags: ['白底', '公安证件'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_038' },
  { id: 'size_039', category: 'social', sceneKey: 'social_security_card', name: '社保卡', scene: '社保卡办理照', tip: '社保卡办理常用规格', pixel: '358×441PX', pixelWidth: 358, pixelHeight: 441, widthMm: 30, heightMm: 37, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '热门', '民生证件'], hot: true, sort: 1, actionPath: '/pages/spec-detail/index?id=size_039' },
  { id: 'size_040', category: 'social', sceneKey: 'marriage_registration', name: '结婚登记照', scene: '结婚登记证件照', tip: '结婚登记照办理常用规格', pixel: '413×579PX', pixelWidth: 413, pixelHeight: 579, widthMm: 35, heightMm: 49, backgroundOptions: ['红底'], tags: ['红底', '热门', '双人照'], hot: true, sort: 2, actionPath: '/pages/spec-detail/index?id=size_040' },
  { id: 'size_041', category: 'social', sceneKey: 'divorce_registration', name: '离婚登记照', scene: '离婚登记证件照', tip: '离婚登记照办理常用规格', pixel: '413×579PX', pixelWidth: 413, pixelHeight: 579, widthMm: 35, heightMm: 49, backgroundOptions: ['白底', '蓝底'], tags: ['白底', '蓝底', '民政'], hot: false, sort: 3, actionPath: '/pages/spec-detail/index?id=size_041' },
  { id: 'size_042', category: 'social', sceneKey: 'college_image_collection', name: '大学生图像采集', scene: '高校毕业生图像采集', tip: '大学生图像采集常用规格', pixel: '480×640PX', pixelWidth: 480, pixelHeight: 640, widthMm: 40, heightMm: 53, backgroundOptions: ['蓝底', '白底'], tags: ['蓝底', '白底', '学籍采集'], hot: true, sort: 4, actionPath: '/pages/spec-detail/index?id=size_042' }
];

const sortTemplates = (templates) => [...templates].sort((left, right) => {
  if (Number(Boolean(right.hot)) !== Number(Boolean(left.hot))) {
    return Number(Boolean(right.hot)) - Number(Boolean(left.hot));
  }

  if (left.sort !== right.sort) {
    return left.sort - right.sort;
  }

  return String(left.id).localeCompare(String(right.id));
});

const getHomeTabs = () => HOME_TEMPLATE_TABS.map(({ key, label }) => ({ key, label }));
const getHomeTab = (key) => HOME_TEMPLATE_TABS.find((tab) => tab.key === key);
const getSpecCategories = () => SPEC_CATEGORIES.map((item) => ({ ...item }));
const getSpecTemplateById = (id) => SPEC_TEMPLATES.find((item) => item.id === id) || null;
const getSpecTemplatesByCategory = (category) => sortTemplates(SPEC_TEMPLATES.filter((item) => !category || item.category === category));
const toHomeTemplate = (template) => ({
  sceneKey: template.sceneKey,
  name: template.name,
  pixelWidth: template.pixelWidth,
  pixelHeight: template.pixelHeight,
  hot: template.hot,
  tip: template.tip || template.scene,
  tags: template.tags || []
});

module.exports = {
  HOME_TEMPLATE_TABS,
  SPEC_CATEGORIES,
  SPEC_TEMPLATES,
  getHomeTabs,
  getHomeTab,
  getSpecCategories,
  getSpecTemplateById,
  getSpecTemplatesByCategory,
  toHomeTemplate,
  sortTemplates
};
