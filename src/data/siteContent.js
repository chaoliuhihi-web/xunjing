import homeReference from '../../assets/references/Web_V3/ChatGPT Image 2026年6月21日 01_10_54 (1).png';
import capabilityReference from '../../assets/references/Web_V3/ChatGPT Image 2026年6月21日 01_10_55 (2).png';
import scenarioReference from '../../assets/references/Web_V3/ChatGPT Image 2026年6月21日 01_10_55 (3).png';
import solutionReference from '../../assets/references/Web_V3/ChatGPT Image 2026年6月21日 01_10_56 (4).png';
import pilotReference from '../../assets/references/Web_V3/ChatGPT Image 2026年6月21日 01_10_56 (5).png';
import travelogueReference from '../../assets/references/Web_V3/ChatGPT Image 2026年6月21日 01_10_57 (6).png';
import aiPlatformImage from '../../assets/references/product_effects/AI中台.png';
import productWideImage from '../../assets/references/product_effects/3.png';
import productBoardImage from '../../assets/references/product_effects/4.png';
import mobileProductImage from '../../assets/references/product_effects/2.png';

export const brand = {
  name: '星河寻境',
  subtitle: '地方 AI 文旅内容运营平台',
  slogan: '智联山河 · 寻境未来',
  logo: '/favicon.svg'
};

export const visualReferences = {
  home: homeReference,
  capabilities: capabilityReference,
  scenarios: scenarioReference,
  solutions: solutionReference,
  pilots: pilotReference,
  travelogue: travelogueReference,
  aiPlatform: aiPlatformImage,
  productWide: productWideImage,
  productBoard: productBoardImage,
  mobileProduct: mobileProductImage
};

export const navItems = [
  { label: '首页', href: '#home', page: 'home' },
  { label: '产品能力', href: '#capabilities', page: 'capabilities' },
  { label: '应用场景', href: '#scenarios', page: 'scenarios' },
  { label: '解决方案', href: '#solutions', page: 'solutions' },
  { label: '试点样板', href: '#pilots', page: 'pilots' },
  { label: '跟着游记', href: '#travelogue', page: 'travelogue' },
  { label: '关于我们', href: '#about', page: 'about' }
];

export const homeMetrics = [
  { value: '128+', label: '合作城市/景区', note: '覆盖文旅局、景区、展馆' },
  { value: '560万+', label: '累计服务游客', note: '小程序、扫码、导览触达' },
  { value: '210%', label: '游客停留提升', note: '内容互动与二次传播拉动' },
  { value: '98.6%', label: '用户满意度', note: '从体验到分享的闭环反馈' }
];

export const capabilityCards = [
  {
    icon: 'book',
    title: '地方知识库',
    desc: '沉淀景区、非遗、人物、路线与研学知识，形成可检索、可复用的内容底座。'
  },
  {
    icon: 'image',
    title: '图片视频库',
    desc: '统一管理图文、视频、VR 与授权素材，支撑内容生产和多端分发。'
  },
  {
    icon: 'bot',
    title: 'AI旅伴',
    desc: '面向游客提供问答、讲解、推荐与个性化行程陪伴。'
  },
  {
    icon: 'pen',
    title: '跟着游记',
    desc: '将一次旅行自动生成游记、纪念册、知识卡片和分享海报。'
  },
  {
    icon: 'qr',
    title: '扫码伴读',
    desc: '一物一码连接纸书、展牌、文创与数字内容，延展线下体验。'
  },
  {
    icon: 'chart',
    title: '数据运营',
    desc: '跟踪内容曝光、互动、转化和满意度，为运营复盘提供依据。'
  }
];

export const painPoints = [
  { title: '资源分散', desc: '图片、讲解、线路和活动分散在不同渠道，难以统一运营。' },
  { title: '内容生产慢', desc: '优质图文、短视频、研学材料依赖人工，更新频率不足。' },
  { title: '体验同质化', desc: '游客只能被动观看，缺少个性化导览和参与机制。' },
  { title: '传播效果弱', desc: '游后分享内容不成体系，无法沉淀为城市和景区资产。' },
  { title: '价值转化难', desc: '内容、票务、文创、研学和会员数据没有形成闭环。' }
];

export const productMatrix = [
  { title: '内容中台', desc: 'AI 内容生产与审核中枢，支撑全域内容管理。' },
  { title: '知识中台', desc: '地方文旅知识资产沉淀、标签化、关联化和检索。' },
  { title: '数据中台', desc: '多源数据接入、指标分析、游客行为洞察。' },
  { title: '运营中台', desc: '活动、营销、会员、渠道和私域运营协同。' },
  { title: '开放中台', desc: 'API/SDK 与第三方系统集成，支持多端落地。' }
];

export const dataCapabilities = [
  '多源数据接入',
  '实时数据处理',
  '智能分析洞察',
  '可视化看板',
  '数据安全合规'
];

export const architectureRows = [
  {
    layer: '应用层',
    desc: '多端触达',
    items: ['游客小程序', '微信公众号', '景区大屏', '自助导览机', '管理后台', '开放 API']
  },
  {
    layer: '能力层',
    desc: 'AI 与业务能力',
    items: ['AI 内容生成', '知识图谱', '智能推荐', '自然语言处理', '计算机视觉', '数据分析']
  },
  {
    layer: '平台层',
    desc: '中台能力',
    items: ['内容中心', '用户中心', '数据中心', '运营中心', '权限中心', '开放中心']
  },
  {
    layer: '基础层',
    desc: '基础设施',
    items: ['公有云/私有云', '大数据存储', 'AI 模型服务', '安全与合规体系']
  }
];

export const capabilityMatrix = [
  'AI 文旅知识库',
  '内容管理',
  '二维码导览',
  'AI 语音讲解',
  '互动问答',
  '游记生成',
  '纪念册生成',
  '活动运营',
  '数据报告',
  '多角色权限',
  '内容审核',
  '来源追溯'
];

export const productionFlow = ['需求分析', '内容生成', '审核发布', '分发触达', '用户互动', '数据分析'];

export const scenarioCards = [
  {
    title: '城市文旅运营',
    desc: '把城市文旅数字化中枢、资源库和游客服务整合起来，提升城市文旅品牌影响力。',
    image: solutionReference
  },
  {
    title: '景区 AI 旅伴',
    desc: '围绕导览、问答、推荐和行程生成，让游客获得陪伴式深度体验。',
    image: scenarioReference
  },
  {
    title: '展馆讲解与参观记录',
    desc: 'AI 讲解展品故事，自动记录参观轨迹与心得，形成可回看的学习档案。',
    image: homeReference
  },
  {
    title: '跟着游记去旅行',
    desc: '基于真实游览轨迹生成个性化游记，让旅行更有温度、更可传播。',
    image: travelogueReference
  },
  {
    title: '图书扫码伴读',
    desc: '扫码获取图书延展内容、作者介绍、知识拓展和互动体验。',
    image: pilotReference
  },
  {
    title: '文旅内容运营',
    desc: 'AI 高效生成优质文旅内容，多渠道分发，提升内容影响力和转化效率。',
    image: productBoardImage
  }
];

export const cooperationSteps = ['需求沟通', '方案规划', '原型设计', '内容整理', '平台开发', '上线运营', '数据报告'];

export const faqs = [
  {
    question: '你们支持哪些地区的合作？',
    answer: '可服务城市文旅局、景区、展馆、研学机构和出版单位，按资源成熟度设计落地路径。'
  },
  {
    question: '是否支持私有化部署？',
    answer: '支持。可按客户安全要求选择公有云、专有云或私有化部署，并配置权限与内容审核。'
  },
  {
    question: '项目周期一般需要多久？',
    answer: 'MVP 样板通常 2-8 周完成，完整平台按资源整理、系统集成和上线范围评估。'
  },
  {
    question: '合作后是否有运营支持？',
    answer: '提供上线培训、内容更新、数据分析和持续优化建议，帮助样板变成长期运营资产。'
  }
];

export const solutionTracks = [
  {
    title: '面向文旅局',
    accent: 'blue',
    problem: ['资源内容分散', '城市品牌表达不统一', '缺少运营工具与数据能力'],
    deliverables: ['区域文旅知识库', '内容资产中台', '城市文旅数据看板', '一体化传播矩阵']
  },
  {
    title: '面向景区',
    accent: 'cyan',
    problem: ['讲解成本高', '游客体验单一', '二次传播少'],
    deliverables: ['智能导览与 AI 讲解', '个性化游览路线推荐', '跟着游记与打卡互动', '游客数据看板与运营']
  },
  {
    title: '面向展馆/博物馆',
    accent: 'violet',
    problem: ['展陈内容静态', '预约与参观数据分散', '研学成果难沉淀'],
    deliverables: ['数字展陈与多媒体内容', 'AI 讲解与虚拟导览', '教育研学内容包', '扫码伴读与互动体验']
  },
  {
    title: '面向出版社/研学',
    accent: 'orange',
    problem: ['内容生产周期长', '纸书延展弱', '用户触达与运营能力不足'],
    deliverables: ['数字化内容生产平台', '研学课程与知识卡片', '互动阅读与扫码伴读', '内容分发与营销工具']
  }
];

export const pilotCases = [
  { title: '新疆喀什 AI 文旅样板', tag: '文化名城', image: pilotReference, metrics: ['230+ 知识条目', '86% 游客满意度', '42% 复游提升'] },
  { title: '北京中轴线数字导览', tag: '世界遗产', image: solutionReference, metrics: ['180+ 内容资产', '128万+ 访问量', '65% 互动参与率'] },
  { title: '四川熊猫研学路线', tag: '自然IP', image: scenarioReference, metrics: ['95+ 课程资源', '62万+ 研学参与', '58% 转化提升'] },
  { title: '敦煌文化数字展陈', tag: '世界文化遗产', image: homeReference, metrics: ['160+ 数字文物', '93万+ 浏览量', '70% 分享率'] },
  { title: '云南非遗内容计划', tag: '民族文化', image: productWideImage, metrics: ['120+ 传承项目', '71万+ 体验人次', '55% 传播增长'] }
];

export const pilotStats = [
  { value: '32%', label: '游客停留时长提升' },
  { value: '28%', label: '游客满意度提升' },
  { value: '41%', label: '内容分享率提升' },
  { value: '25%', label: '客诉率下降' },
  { value: '38%', label: '运营效率提升' },
  { value: '23%', label: '人力成本降低' }
];

export const methodology = ['需求洞察', '方案共创', '小步快跑', '规模复制', '持续运营'];

export const reusableModules = [
  'AI 导览引擎',
  '内容生成引擎',
  '数据分析看板',
  '活动运营模块',
  '知识与资源库',
  '集成开放能力'
];

export const testimonials = [
  { name: '喀什文旅局', text: 'AI 导览让游客更愿意停留，也让我们更精准地看见景区体验问题。' },
  { name: '南疆亲子路研学方', text: '亲子内容记录和研学成果沉淀，让项目有了可持续复用的内容资产。' },
  { name: '某 5A 景区', text: 'AI 导览提升了讲解体验，也减少了现场人力压力。' },
  { name: '某省博物馆', text: 'AI 问答让文物讲述更鲜活，参观后的分享内容明显变多。' }
];

export const travelogueSteps = [
  { title: '上传旅行素材', desc: '上传图片、视频、票根或导入行程记录。' },
  { title: 'AI 识别理解', desc: '识别时间、地点、人物和场景，提炼旅程信息。' },
  { title: '生成游记内容', desc: '生成图文并茂的游记故事与知识卡片。' },
  { title: '个性化编辑', desc: '调整语气、封面、风格和重点段落。' },
  { title: '导出与分享', desc: '一键生成多种格式，分发给亲友或社交平台。' }
];

export const audienceCards = [
  { title: '亲子家庭', desc: '记录家庭旅行的温暖时光，沉淀孩子成长的美好记忆。' },
  { title: '学生群体', desc: '记录研学、旅行与成长体验，丰富个人作品集和实践材料。' },
  { title: '教育机构', desc: '助力研学课程成果沉淀，提升教学效果与品牌价值。' },
  { title: '旅行达人', desc: '高效创作优质内容，分享见闻，沉淀影响力。' }
];

export const travelogueOutputs = [
  { title: '旅拍纪念册', desc: '把照片、路线和故事生成一本有温度的电子纪念册。' },
  { title: '游记长文', desc: 'AI 整理真实经历，生成可发布的图文游记。' },
  { title: '知识卡片', desc: '把景点、历史和文化提炼为可收藏的知识卡。' },
  { title: '家庭旅行档案', desc: '自动沉淀家庭旅行轨迹，记录成员与情绪。' },
  { title: '分享海报', desc: '生成适合朋友圈、小红书和社群转发的海报。' },
  { title: '纸质纪念书', desc: '支持印刷输出，把数字旅程变成可收藏的实体纪念。' }
];

export const pages = {
  home: {
    hero: {
      title: '把地方文旅资源转化为游客可参与、可分享、可传播的数据化内容资产',
      desc: '整合 AI 能力与文旅行业知识，实现内容智能生产、管理、分发与运营，助力目的地与景区构建可持续的数字化文旅生态。',
      primaryCta: '免费体验',
      secondaryCta: '预约演示'
    }
  },
  capabilities: {
    hero: {
      title: '一套平台，连接文旅资源、游客体验与运营数据。',
      desc: '整合 AI 能力与文旅行业知识，实现内容智能生产、管理、分发与运营，助力目的地与景区构建可持续的数字化文旅生态。'
    }
  },
  scenarios: {
    hero: {
      title: '用 AI 重新讲述一座城市、一处景区、一次旅行。',
      desc: '星河寻境帮助文旅行业激活内容价值，提升服务体验，驱动业务增长。'
    }
  },
  solutions: {
    hero: {
      title: '地方文旅 AI 内容资产运营平台解决方案',
      desc: '以内容资产为核心，以 AI 为驱动，帮助地方文旅行业实现内容生产、资产沉淀、智能分发与运营增长的全链路数字化升级。'
    }
  },
  pilots: {
    hero: {
      title: '从一个目的地开始，沉淀可复制的 AI 文旅样板。',
      desc: '我们与文旅局、景区、博物馆及运营机构深度共创，用 AI 能力解决真实问题，形成可落地、可复制、可规模化的文旅样板。'
    }
  },
  travelogue: {
    hero: {
      title: '把每一次旅行，生成一本有照片、有故事、有知识的纪念书。',
      desc: '星河寻境 AI 陪伴你记录旅途中的美好瞬间，智能生成内容、整理知识、沉淀回忆，让记忆更有温度、让分享更有价值。'
    }
  }
};
