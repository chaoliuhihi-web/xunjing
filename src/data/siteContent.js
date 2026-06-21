import brandScene from '../../assets/brand/LOGO/newdesign/normalized/xinghe-brand-scene-primary.png';
import brandLogo from '../../assets/brand/LOGO/透明横版1.png';
import brandLogoAlt from '../../assets/brand/LOGO/newdesign/normalized/xinghe-logo-horizontal-alt.png';
import brandLogoSquare from '../../assets/brand/LOGO/newdesign/normalized/xinghe-logo-square-primary.png';
import brandLogoSquareAlt from '../../assets/brand/LOGO/newdesign/normalized/xinghe-logo-square-alt.png';
import capabilityAiCompanionVisual from '../../assets/generated/web-v4/capability-ai-companion.png';
import capabilityDataAnalyticsVisual from '../../assets/generated/web-v4/capability-data-analytics.png';
import capabilityKnowledgeBaseVisual from '../../assets/generated/web-v4/capability-knowledge-base.png';
import capabilityMediaLibraryVisual from '../../assets/generated/web-v4/capability-media-library.png';
import capabilityQrGuideVisual from '../../assets/generated/web-v4/capability-qr-guide.png';
import capabilityTravelogueVisual from '../../assets/generated/web-v4/capability-travelogue.png';
import chineseRiverHeroVideo from '../../assets/generated/web-v4/chinese-heritage-river-hero.mp4';
import chineseRiverHeroPoster from '../../assets/generated/web-v4/chinese-heritage-river-poster.jpg';
import contentOperationVisual from '../../assets/generated/web-v4/content-operation-visual.png';
import generatedHeroVisual from '../../assets/generated/web-v4/hero-launch-ai-cultural-tourism.png';
import museumStudyVisual from '../../assets/generated/web-v4/museum-study-visual.png';
import pilotSampleVisual from '../../assets/generated/web-v4/pilot-sample-projects-visual.png';
import generatedPlatformVisual from '../../assets/generated/web-v4/platform-capability-visual.png';
import productUiShowcaseVisual from '../../assets/generated/web-v4/product-ui-showcase-visual.png';
import qrAiGuideVisual from '../../assets/generated/web-v4/qr-ai-guide-visual.png';
import generatedScenarioVisual from '../../assets/generated/web-v4/scenario-operation-visual.png';
import solutionEcosystemVisual from '../../assets/generated/web-v4/solution-ecosystem-visual.png';
import travelogueMemoryVisual from '../../assets/generated/web-v4/travelogue-memory-visual.png';

export const brand = {
  name: '星河寻境',
  subtitle: '目的地 AI 叙事与内容运营系统',
  slogan: '让城市会讲述 · 让旅行会留下',
  logo: brandLogo,
  logoAlt: brandLogoAlt,
  logoSquare: brandLogoSquare,
  logoSquareAlt: brandLogoSquareAlt,
  brandScene
};

export const visualReferences = {
  home: generatedHeroVisual,
  capabilities: generatedPlatformVisual,
  scenarios: generatedScenarioVisual,
  solutions: solutionEcosystemVisual,
  pilots: pilotSampleVisual,
  travelogue: travelogueMemoryVisual,
  generatedHero: generatedHeroVisual,
  generatedPlatform: generatedPlatformVisual,
  generatedScenario: generatedScenarioVisual,
  generatedSolution: solutionEcosystemVisual,
  generatedPilot: pilotSampleVisual,
  generatedTravelogue: travelogueMemoryVisual,
  generatedProductUi: productUiShowcaseVisual,
  generatedMuseumStudy: museumStudyVisual,
  generatedContentOperation: contentOperationVisual,
  generatedQrGuide: qrAiGuideVisual,
  heroRiverVideo: chineseRiverHeroVideo,
  heroRiverPoster: chineseRiverHeroPoster,
  aiPlatform: generatedPlatformVisual,
  productWide: productUiShowcaseVisual
};

export const navItems = [
  { label: '首页', href: '#home', page: 'home' },
  { label: '产品能力', href: '#capabilities', page: 'capabilities' },
  { label: '应用场景', href: '#scenarios', page: 'scenarios' },
  { label: '解决方案', href: '#solutions', page: 'solutions' },
  { label: '试点样板', href: '#pilots', page: 'pilots' },
  { label: 'AI旅伴', href: '#travelogue', page: 'travelogue' },
  { label: '关于我们', href: '#about', page: 'about' }
];

export const homeMetrics = [
  { value: '1套', label: '目的地叙事系统', note: '知识、导览、互动、传播闭环' },
  { value: '6类', label: '核心落地场景', note: '城市、景区、展馆、研学、出版、公益' },
  { value: '可复盘', label: '传播数据报告', note: '访问、问答、生成、分享全链路沉淀' },
  { value: '可复制', label: 'AI 文旅样板', note: '从一个高价值样板到多场景推广' }
];

export const capabilityCards = [
  {
    icon: 'book',
    title: '文旅知识库',
    desc: '把城市故事、景区讲解、展品资料、图书内容和研学素材整理成可审校、可维护、可调用的知识资产。',
    image: capabilityKnowledgeBaseVisual
  },
  {
    icon: 'image',
    title: '图片视频库',
    desc: '统一沉淀图片、视频、地图、展陈和活动素材，让每一份视觉资料都能被持续调用和传播。',
    image: capabilityMediaLibraryVisual
  },
  {
    icon: 'bot',
    title: 'AI旅伴',
    desc: '为目的地配置可问、可听、可互动的 AI 旅伴，让游客在现场获得陪伴式讲解和路线建议。',
    image: capabilityAiCompanionVisual
  },
  {
    icon: 'pen',
    title: '多媒体游记',
    desc: '游客上传照片、路线或素材后，自动生成游记、知识卡片、纪念册和分享海报。',
    image: capabilityTravelogueVisual
  },
  {
    icon: 'qr',
    title: '扫码伴读',
    desc: '让图书、地图、展板、研学手册和公益读物通过二维码获得 AI 讲解、问答和延展内容。',
    image: capabilityQrGuideVisual
  },
  {
    icon: 'chart',
    title: '数据运营',
    desc: '沉淀访问、问答、生成、分享和活动参与数据，形成可汇报、可复盘、可复制的项目成果。',
    image: capabilityDataAnalyticsVisual
  }
];

export const painPoints = [
  { title: '资源很多，真正被记住的不多', desc: '地方故事、景点资料、图片视频和活动素材长期分散，游客到访后很难形成清晰记忆。' },
  { title: '游客来了，内容没有留下', desc: '一次游览结束后，照片散落在手机里，讲解和路线没有变成可收藏、可分享的内容。' },
  { title: '活动做了，复盘难以沉淀', desc: '活动访问、问答、生成、分享等数据没有被整理成可汇报、可复盘的成果材料。' },
  { title: '文化被展示，却没有被体验', desc: '展板、图书、展品和路线只是静态呈现，缺少即时问答、伴读讲解和互动表达。' },
  { title: '项目上线，却缺少可复制样板', desc: '很多数字化项目停留在一次性展示，难以复制到更多目的地、展馆、研学和出版场景。' }
];

export const productMatrix = [
  { title: '目的地叙事系统', desc: '把城市、景区、展馆和图书的核心故事整理成可讲述、可互动、可传播的系统。' },
  { title: '地方知识资产', desc: '将讲解词、展品资料、路线信息、图文视频和研学材料沉淀为可维护的知识库。' },
  { title: 'AI 互动体验', desc: '通过 AI 旅伴、智能问答、路线推荐和扫码伴读，让游客在现场获得陪伴式服务。' },
  { title: '游客内容沉淀', desc: '把照片、路线、心得和活动记录生成游记、纪念册、知识卡片和分享海报。' },
  { title: '传播数据报告', desc: '沉淀访问、互动、生成、分享和反馈数据，形成客户可汇报、可复盘的运营成果。' }
];

export const dataCapabilities = [
  '访问与互动数据',
  '热门问题洞察',
  '游记生成统计',
  '分享传播追踪',
  '项目汇报报告'
];

export const architectureRows = [
  {
    layer: '体验入口',
    desc: '游客可用',
    items: ['游客小程序', 'H5 专题', '二维码入口', '活动页面', '分享海报', '管理后台']
  },
  {
    layer: '内容资产',
    desc: '地方可管',
    items: ['文旅知识库', '图片视频库', '路线素材', '展品资料', '图书内容', '活动素材']
  },
  {
    layer: 'AI 能力',
    desc: '内容可讲',
    items: ['AI 讲解', '互动问答', '路线推荐', '游记生成', '知识卡片', '纪念册生成']
  },
  {
    layer: '运营沉淀',
    desc: '项目可复盘',
    items: ['访问统计', '问答记录', '生成数据', '分享传播', '用户反馈', '汇报报告']
  }
];

export const capabilityMatrix = [
  '目的地知识库',
  '图片视频资产',
  'AI旅伴',
  '扫码伴读',
  '智能导览',
  '游客问答',
  '路线推荐',
  '游记生成',
  '纪念册生成',
  '活动专题',
  '传播数据',
  '项目报告'
];

export const productionFlow = ['资源梳理', '知识入库', '体验设计', '上线触达', '内容生成', '数据复盘'];

export const scenarioCards = [
  {
    title: '城市文旅运营',
    desc: '把城市故事、线路、非遗、活动和公共文化资源整理成可讲述、可搜索、可传播的 AI 文旅样板。',
    image: generatedScenarioVisual
  },
  {
    title: '景区 AI 旅伴',
    desc: '让游客在现场扫码即可听讲解、问问题、看路线、生成游记，把一次到访变成一段可带走的内容。',
    image: generatedHeroVisual
  },
  {
    title: '展馆讲解与参观记录',
    desc: '把展品资料和策展叙事转化为 AI 问答、伴读讲解和参观记录，服务展陈、研学与复盘。',
    image: generatedPlatformVisual
  },
  {
    title: '多媒体游记去旅行',
    desc: '基于照片、路线和知识点生成个性化游记、纪念册和分享海报，让游客成为目的地传播者。',
    image: travelogueMemoryVisual
  },
  {
    title: '图书扫码伴读',
    desc: '让图书、地图册和研学读物拥有二维码 AI 讲解、知识拓展、互动问答和学习成果生成。',
    image: qrAiGuideVisual
  },
  {
    title: '公益与研学行动',
    desc: '围绕地方文化、国家版图、自然科普和城市记忆，沉淀可参与、可展示、可汇报的活动成果。',
    image: contentOperationVisual
  }
];

export const cooperationSteps = ['场景确认', '资源梳理', '样板设计', '平台配置', '上线运营', '传播沉淀', '报告复盘'];

export const faqs = [
  {
    question: '没有完整数字化基础，也能做样板吗？',
    answer: '可以。我们会先选择一个高价值场景，把现有图文、讲解、路线或图书内容整理成小样板，再逐步扩展。'
  },
  {
    question: '样板项目一般多久能上线？',
    answer: '轻量样板通常 2-8 周上线，具体取决于资料完整度、交互范围、二维码入口和数据报告要求。'
  },
  {
    question: '内容准确性和安全性如何控制？',
    answer: '支持来源标注、人工审校、知识库权限、发布审核和敏感内容控制，确保 AI 讲解和伴读内容可管理。'
  },
  {
    question: '上线后能提供哪些成果材料？',
    answer: '可输出访问、问答、生成、分享、活动参与等传播数据报告，也能整理游记、纪念册和活动成果素材。'
  }
];

export const solutionTracks = [
  {
    title: '文旅局解决方案',
    accent: 'blue',
    problem: ['地方资源很多，但缺少统一叙事入口', '活动成果难以沉淀为长期资产', '对外汇报缺少可视化数据和传播证据'],
    deliverables: ['城市 AI 文旅样板', '区域知识库与素材库', '游客互动与游记生成入口', '传播数据报告']
  },
  {
    title: '景区解决方案',
    accent: 'cyan',
    problem: ['讲解体验单一，游客停留不深', '游客拍了照片却没有形成传播内容', '导览、问答、路线和活动数据分散'],
    deliverables: ['AI 旅伴与智能导览', '扫码伴读与路线推荐', '多媒体游记与纪念册生成', '游客互动数据报告']
  },
  {
    title: '展馆/博物馆解决方案',
    accent: 'violet',
    problem: ['展陈内容静态，观众互动不足', '展品资料不易转化为研学成果', '参观后的学习与分享缺少承接'],
    deliverables: ['展品 AI 讲解与问答', '参观记录与知识卡片', '研学成果册生成', '展馆运营数据沉淀']
  },
  {
    title: '研学/出版/公益解决方案',
    accent: 'orange',
    problem: ['纸质内容延展弱，互动体验不足', '研学过程有参与但成果不成体系', '公益行动需要可展示、可复盘的传播材料'],
    deliverables: ['图书扫码伴读', 'AI 知识问答与拓展', '研学任务与成果生成', '活动传播与汇报报告']
  }
];

export const pilotCases = [
  { title: '喀什 AI 文旅样板', tag: '城市样板', image: pilotSampleVisual, metrics: ['城市导览', '亲子研学', '传播报告'] },
  { title: '图秀中华公益行动 · 新疆首站', tag: '公益教育', image: solutionEcosystemVisual, metrics: ['版图知识', '扫码伴读', '研学成果'] },
  { title: '国家公园 AI 科普样板', tag: '自然教育', image: generatedScenarioVisual, metrics: ['AI科普旅伴', '自然观察任务', '亲子纪念册'] },
  { title: '城市文化导览样板', tag: '城市更新', image: contentOperationVisual, metrics: ['历史街区', '非遗故事', '传播专题'] },
  { title: '博物馆 AI 讲解样板', tag: '展馆研学', image: museumStudyVisual, metrics: ['展品问答', '参观记录', '研学报告'] }
];

export const pilotStats = [
  { value: '2-8周', label: '样板上线周期' },
  { value: '6类', label: '可复用模块' },
  { value: '100+', label: '内容资产沉淀' },
  { value: '多端', label: '游客互动入口' },
  { value: '多格式', label: '传播素材输出' },
  { value: '1份', label: '数据报告交付' }
];

export const methodology = ['找准场景', '整理资源', '设计入口', '形成传播', '输出报告', '复制场景'];

export const reusableModules = [
  '文旅知识库',
  'AI旅伴',
  '扫码伴读',
  '多媒体游记',
  '活动专题',
  '传播数据报告'
];

export const testimonials = [
  { name: '喀什样板共创方', text: '以前资源散在材料里，现在可以通过 AI 导览、游记和报告变成可展示的样板成果。' },
  { name: '研学项目负责人', text: '孩子们不只是完成一次参观，而是留下了知识卡片、游记和成果册，后续汇报也更清楚。' },
  { name: '景区运营负责人', text: '扫码讲解、游客问答和分享数据被串起来后，运营复盘不再只靠现场感受。' },
  { name: '出版合作方', text: '纸书通过扫码伴读连接了 AI 问答和延展内容，读者互动明显更自然。' }
];

export const travelogueSteps = [
  { title: '上传旅行照片', desc: '上传照片、视频、票根或导入路线，让系统识别旅途中的时间、地点和人物。' },
  { title: '匹配地方知识', desc: '结合目的地知识库，自动补充景点故事、历史文化、自然科普和研学知识。' },
  { title: '生成旅行故事', desc: 'AI 将素材整理成有情绪、有结构、有知识点的图文游记。' },
  { title: '编辑纪念风格', desc: '选择亲子、研学、城市漫游、自然观察等风格，调整封面、语气和重点段落。' },
  { title: '导出分享成果', desc: '一键生成电子纪念册、纸质纪念书、知识卡片、分享海报或研学成果册。' }
];

export const audienceCards = [
  { title: '亲子家庭', desc: '把一次家庭出行整理成孩子看得懂、家长愿意收藏的旅行故事。' },
  { title: '学生研学', desc: '把参观、观察和任务记录生成知识卡片、研学报告和成果册。' },
  { title: '教育机构', desc: '让研学课程从现场体验延伸到学习成果、家校反馈和品牌传播。' },
  { title: '景区活动运营方', desc: '把活动打卡、游客照片和互动数据沉淀成二次传播素材。' }
];

export const travelogueOutputs = [
  { title: '旅拍纪念册', desc: '把照片、路线和故事生成一本有温度的电子纪念册。' },
  { title: '游记长文', desc: 'AI 整理真实经历，生成可发布的图文游记。' },
  { title: '知识卡片', desc: '把景点、历史和文化提炼为可收藏的知识卡。' },
  { title: '家庭旅行档案', desc: '自动沉淀家庭旅行轨迹，记录成员与情绪。' },
  { title: '分享海报', desc: '生成适合朋友圈、小红书和社群转发的海报。' },
  { title: '纸质纪念书', desc: '支持印刷输出，把数字旅程变成可收藏的实体纪念。' },
  { title: '研学成果册', desc: '把路线、任务、照片和知识点整理成可提交、可展示的学习成果。' }
];

export const pages = {
  home: {
    hero: {
      title: '星河寻境 AI 文旅内容运营平台',
      titleLines: ['星河寻境', 'AI 文旅内容运营平台'],
      desc: '让每一处风景被讲述，让每一次旅行被记录，让每一个目的地被传播。',
      primaryCta: '预约样板演示',
      secondaryCta: '查看解决方案'
    }
  },
  capabilities: {
    hero: {
      title: '从地方资源到游客传播，一套完整的 AI 文旅运营能力。',
      titleLines: ['从地方资源到游客传播，', '一套完整的', 'AI 文旅运营能力。'],
      desc: '把内容资产、AI 互动、游客生成内容和传播报告放进同一套工作流，帮助目的地把文化资源转化为长期运营价值。'
    }
  },
  scenarios: {
    hero: {
      title: '让城市、景区、展馆和图书，都拥有 AI 表达能力。',
      titleLines: ['让城市、景区、', '展馆和图书，', '都拥有 AI 表达能力。'],
      desc: '让每一处风景被讲述，让每一次旅行被记录，让每一个目的地被传播。'
    }
  },
  solutions: {
    hero: {
      title: '为不同文旅客户，交付可上线、可汇报、可复制的 AI 样板。',
      titleLines: ['为不同文旅客户，', '交付可上线、可汇报、', '可复制的 AI 样板。'],
      desc: '围绕文旅局、景区、展馆、研学和出版客户，按场景组合文旅知识库、AI 旅伴、扫码伴读、多媒体游记和传播报告。'
    }
  },
  pilots: {
    hero: {
      title: '先做一个样板，再复制一套模式。',
      titleLines: ['先做一个样板，', '再复制一套模式。'],
      desc: '从一个目的地、一本图书、一个展馆或一次活动切入，快速上线可体验、可传播、可汇报的 AI 文旅样板。'
    }
  },
  travelogue: {
    hero: {
      title: '让游客带走的不只是一张照片，而是会被记住的旅行故事。',
      titleLines: ['让游客带走的', '不只是一张照片，', '而是会被记住的旅行故事。'],
      desc: '把照片、路线、知识点和现场体验生成游记、纪念册、知识卡片和分享海报，让游客内容成为目的地的二次传播资产。'
    }
  }
};
