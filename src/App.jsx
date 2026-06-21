import {
  ArrowRight,
  Share2,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Download,
  FileText,
  Globe2,
  Image,
  Layers3,
  Mail,
  MapPin,
  MapPinned,
  Menu,
  PenLine,
  Phone,
  PlayCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  architectureRows,
  audienceCards,
  brand,
  capabilityCards,
  capabilityMatrix,
  cooperationSteps,
  dataCapabilities,
  faqs,
  homeMetrics,
  methodology,
  navItems,
  pages,
  painPoints,
  pilotCases,
  pilotStats,
  productMatrix,
  productionFlow,
  reusableModules,
  scenarioCards,
  solutionTracks,
  testimonials,
  travelogueOutputs,
  travelogueSteps,
  visualReferences
} from './data/siteContent';
import { submitLead } from './utils/leadSubmission';

const iconMap = {
  book: BookOpen,
  image: Image,
  bot: Bot,
  pen: PenLine,
  qr: QrCode,
  chart: BarChart3
};

const pageHeroBadges = {
  home: ['风景讲述', '旅行记录', '目的地传播'],
  capabilities: ['文旅知识库', '游客内容沉淀', '数据复盘'],
  scenarios: ['景区导览', '扫码伴读', '研学传播'],
  solutions: ['文旅局样板', '景区样板', '展馆样板'],
  pilots: ['样板上线', '报告汇报', '多地复制'],
  travelogue: ['照片成册', '知识入文', '分享传播'],
  about: ['内容资产', '样板交付', '长期运营']
};

const validPages = new Set(navItems.map((item) => item.page));

function routeFromHash() {
  const hash = window.location.hash.replace('#', '');
  return validPages.has(hash) ? hash : 'home';
}

function IconBubble({ icon = Sparkles, tone = 'blue' }) {
  const Icon = typeof icon === 'string' ? iconMap[icon] || Sparkles : icon;
  return (
    <span className={`icon-bubble icon-bubble--${tone}`} aria-hidden="true">
      <Icon size={22} strokeWidth={2.1} />
    </span>
  );
}

function SectionHeader({ eyebrow, title, desc, align = 'center' }) {
  return (
    <div className={`section-header section-header--${align}`}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {desc ? <p>{desc}</p> : null}
    </div>
  );
}

function Header({ activePage, onNavigate, onDemo }) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (event, item) => {
    event.preventDefault();
    setOpen(false);
    onNavigate(item.page);
  };

  return (
    <header className="site-header">
      <a className="brand-link" href="#home" onClick={(event) => handleNavigate(event, navItems[0])}>
        <img src={brand.logo} alt={brand.name} />
      </a>

      <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="主导航">
        {navItems.map((item) => (
          <a
            className={activePage === item.page ? 'is-active' : ''}
            href={item.href}
            key={item.href}
            onClick={(event) => handleNavigate(event, item)}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <button className="ghost-button header-login" type="button">
          登录
        </button>
        <button className="primary-button header-demo" type="button" onClick={onDemo}>
          预约样板
        </button>
        <button
          aria-expanded={open}
          aria-label={open ? '关闭导航' : '打开导航'}
          className="menu-button"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

function Hero({ pageKey, eyebrow, title, titleLines, desc, primary = '预约样板演示', secondary = '查看样板路径', onDemo }) {
  const refMap = {
    home: visualReferences.home,
    capabilities: visualReferences.capabilities,
    scenarios: visualReferences.scenarios,
    solutions: visualReferences.solutions,
    pilots: visualReferences.pilots,
    travelogue: visualReferences.travelogue,
    about: visualReferences.home
  };
  const badges = pageHeroBadges[pageKey] || [];
  const useRiverVideo = pageKey === 'home';
  const headingLines = Array.isArray(titleLines) && titleLines.length > 0 ? titleLines : [title];

  return (
    <section className={`hero hero--${pageKey}`}>
      {useRiverVideo ? (
        <video
          aria-hidden="true"
          className="hero-video"
          poster={visualReferences.heroRiverPoster}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={visualReferences.heroRiverVideo} type="video/mp4" />
        </video>
      ) : (
        <img className="hero-bg-image" src={refMap[pageKey]} alt="" aria-hidden="true" />
      )}
      <div className="hero-motion-layer" aria-hidden="true">
        <span className="mist mist--a" />
        <span className="mist mist--b" />
        <span className="hero-light-sweep" />
      </div>
      <span className="hero-glow-ring" aria-hidden="true" />
      <div className="hero-copy">
        {eyebrow ? <p className="hero-eyebrow">{eyebrow}</p> : null}
        <h1 aria-label={title}>
          {headingLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p>{desc}</p>
        <div className="hero-badges" aria-label="核心能力">
          {badges.map((badge) => (
            <span className="hero-badge" key={badge}>
              {badge}
            </span>
          ))}
        </div>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={onDemo}>
            {primary}
            <ArrowRight size={18} />
          </button>
          <button className="secondary-button" type="button">
            <PlayCircle size={18} />
            {secondary}
          </button>
        </div>
      </div>
    </section>
  );
}

function MetricsStrip({ items = homeMetrics }) {
  return (
    <section className="metrics-strip" aria-label="运营数据">
      {items.map((item) => (
        <div className="metric-card" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
          {item.note ? <small>{item.note}</small> : null}
        </div>
      ))}
    </section>
  );
}

function CapabilityGrid({ compact = false }) {
  return (
    <div className={compact ? 'capability-grid capability-grid--compact' : 'capability-grid'}>
      {capabilityCards.map((card) => (
        <article className="glass-card capability-card" key={card.title}>
          <div className="capability-media">
            <img src={card.image} alt="" />
          </div>
          <div className="capability-copy">
            <IconBubble icon={card.icon} />
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function HomePage({ onDemo }) {
  return (
    <>
      <Hero
        pageKey="home"
        title={pages.home.hero.title}
        titleLines={pages.home.hero.titleLines}
        desc={pages.home.hero.desc}
        primary={pages.home.hero.primaryCta}
        secondary={pages.home.hero.secondaryCta}
        onDemo={onDemo}
      />
      <MetricsStrip />
      <section className="section padded-section">
        <CapabilityGrid />
      </section>
      <section className="section panel-section">
        <SectionHeader align="left" title="为什么目的地需要自己的 AI 叙事系统" desc="文旅客户不缺资源，缺的是让资源被讲述、被体验、被带走、被复盘的方式。" />
        <div className="pain-grid">
          {painPoints.map((item, index) => (
            <article className="soft-card" key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section matrix-section">
        <div className="section-topline">
          <SectionHeader align="left" title="星河寻境如何让目的地“活起来”" desc="从资源入库、AI 互动到游客内容沉淀和传播报告，形成可运营的完整闭环。" />
          <a className="text-link" href="#capabilities">
            查看完整能力 <ArrowRight size={16} />
          </a>
        </div>
        <div className="matrix-grid">
          {productMatrix.map((item) => (
            <article className="glass-card matrix-card" key={item.title}>
              <IconBubble icon={Layers3} tone="cyan" />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
      <ProductShowcase />
      <section className="section data-section">
        <SectionHeader align="left" title="传播数据报告" desc="把访问、问答、生成、分享和活动参与沉淀成可汇报、可复盘、可复制的项目成果。" />
        <div className="data-grid">
          {dataCapabilities.map((item) => (
            <div className="soft-card data-card" key={item}>
              <IconBubble icon={ShieldCheck} />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>
      <CtaBand
        title="让城市会讲述，让景区会陪伴，让展馆会回应，让旅行会留下。"
        desc="从一个高价值样板开始，沉淀属于目的地自己的 AI 内容资产。"
        onDemo={onDemo}
      />
    </>
  );
}

function ProductShowcase() {
  const [active, setActive] = useState('样板总览');
  const tabs = ['样板总览', '内容资产', '传播数据', '游记成果', '文旅知识库', '活动专题'];

  return (
    <section className="section product-showcase">
      <SectionHeader title="样板项目运营界面" desc="用可演示、可管理、可汇报的平台界面承载内容资产、AI 体验和传播数据。" />
      <div className="tabs" role="tablist" aria-label="样板界面类型">
        {tabs.map((tab) => (
          <button
            aria-selected={active === tab}
            className={active === tab ? 'is-active' : ''}
            key={tab}
            role="tab"
            type="button"
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="showcase-stage">
        <img src={visualReferences.productWide} alt="星河寻境产品总览界面" />
        <div className="showcase-phone">
          <img src={visualReferences.generatedQrGuide} alt="星河寻境扫码导览能力视觉" />
        </div>
        <div className="showcase-caption">
          <strong>{active}</strong>
          <span>内容资产、游客互动、传播报告一体化沉淀</span>
        </div>
      </div>
    </section>
  );
}

function CapabilitiesPage({ onDemo }) {
  return (
    <>
      <Hero
        pageKey="capabilities"
        title={pages.capabilities.hero.title}
        titleLines={pages.capabilities.hero.titleLines}
        desc={pages.capabilities.hero.desc}
        primary="预约能力演示"
        secondary="查看样板路径"
        onDemo={onDemo}
      />
      <MetricsStrip
        items={[
          { value: '1套', label: '目的地叙事闭环' },
          { value: '6类', label: '样板落地场景' },
          { value: '多端', label: '游客互动入口' },
          { value: '多格式', label: '内容成果输出' },
          { value: '1份', label: '传播数据报告' }
        ]}
      />
      <section className="section architecture-section">
        <SectionHeader align="left" title="从资源到传播的闭环架构" desc="每一层都服务于客户最关心的结果：能上线、能使用、能传播、能汇报。" />
        <div className="architecture-table">
          {architectureRows.map((row) => (
            <div className="architecture-row" key={row.layer}>
              <div className="architecture-layer">
                <strong>{row.layer}</strong>
                <span>{row.desc}</span>
              </div>
              <div className="architecture-items">
                {row.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeader title="可组合的 AI 文旅样板能力" desc="按城市、景区、展馆、研学和出版项目灵活组合，避免做成一次性展示。" />
        <div className="capability-matrix">
          {capabilityMatrix.map((item, index) => (
            <article className="glass-card module-card" key={item}>
              <IconBubble icon={capabilityCards[index % capabilityCards.length].icon} />
              <h3>{item}</h3>
              <p>{['知识沉淀', '内容生产', '智能服务', '数据运营'][index % 4]}能力可按场景组合交付。</p>
            </article>
          ))}
        </div>
      </section>
      <FlowSection title="从资源梳理到传播复盘" steps={productionFlow} />
      <SupportBand />
    </>
  );
}

function ScenariosPage({ onDemo }) {
  return (
    <>
      <Hero pageKey="scenarios" title={pages.scenarios.hero.title} titleLines={pages.scenarios.hero.titleLines} desc={pages.scenarios.hero.desc} primary="预约场景沟通" onDemo={onDemo} />
      <section className="section">
        <SectionHeader title="AI 叙事进入真实文旅场景" desc="让城市、景区、展馆、研学、出版和公益项目，都有可体验、可传播、可沉淀的数字入口。" />
        <div className="scenario-grid">
          {scenarioCards.map((card) => (
            <article className="scenario-card" key={card.title}>
              <img src={card.image} alt="" />
              <div>
                <IconBubble icon={MapPinned} />
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <a href="#solutions">查看方案 <ArrowRight size={14} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <FlowSection title="样板共创流程" steps={cooperationSteps} />
      <ContactSection onDemo={onDemo} />
      <FaqSection />
      <AboutPanel />
    </>
  );
}

function SolutionsPage({ onDemo }) {
  return (
    <>
      <Hero pageKey="solutions" title={pages.solutions.hero.title} titleLines={pages.solutions.hero.titleLines} desc={pages.solutions.hero.desc} primary="预约方案沟通" secondary="查看样板案例" onDemo={onDemo} />
      <section className="section solution-section">
        <div className="solution-grid">
          {solutionTracks.map((track) => (
            <article className={`solution-card solution-card--${track.accent}`} key={track.title}>
              <IconBubble icon={Building2} tone={track.accent} />
              <h3>{track.title}</h3>
              <div className="solution-block">
                <strong>客户关注</strong>
                <ul>
                  {track.problem.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="solution-block">
                <strong>典型交付</strong>
                <ul>
                  {track.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeader title="可复用能力组件" desc="以模块化方式组合交付，让一个样板可以复制到更多场景。" />
        <div className="module-strip">
          {capabilityCards.map((card) => (
            <div className="module-item" key={card.title}>
              <IconBubble icon={card.icon} />
              <strong>{card.title}</strong>
              <span>{card.desc}</span>
            </div>
          ))}
        </div>
      </section>
      <PilotPreview />
      <CtaBand title="把分散的地方资源，做成客户看得见的 AI 文旅样板。" desc="先上线一个可体验、可汇报的小样板，再复制到更多目的地和内容项目。" onDemo={onDemo} />
    </>
  );
}

function PilotsPage({ onDemo }) {
  return (
    <>
      <Hero pageKey="pilots" title={pages.pilots.hero.title} titleLines={pages.pilots.hero.titleLines} desc={pages.pilots.hero.desc} primary="预约样板演示" secondary="查看方法论" onDemo={onDemo} />
      <section className="section">
        <SectionHeader title="精选 AI 文旅样板" desc="从一个高价值场景切入，快速形成可演示、可传播、可复盘的成果。" />
        <div className="pilot-grid">
          {pilotCases.map((item, index) => (
            <article className="pilot-card" key={item.title}>
              <span className="pilot-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="pilot-image">
                <img src={item.image} alt="" />
                <span>{item.tag}</span>
              </div>
              <h3>{item.title}</h3>
              <ul>
                {item.metrics.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
              <a href="#scenarios">查看场景 <ArrowRight size={14} /></a>
            </article>
          ))}
        </div>
      </section>
      <section className="section stats-section">
        <SectionHeader title="样板交付价值" desc="我们更关注客户能否上线、汇报、传播和复制，而不是只做概念展示。" />
        <div className="pilot-stat-grid">
          {pilotStats.map((item) => (
            <div className="stat-card" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>
      <FlowSection title="样板方法论：从验证到复制" steps={methodology} />
      <section className="section">
        <SectionHeader title="可复制的样板资产" desc="把一次项目沉淀为后续项目可复用的内容、工具和报告。" />
        <div className="reusable-grid">
          {reusableModules.map((item) => (
            <div className="soft-card reusable-card" key={item}>
              <IconBubble icon={Database} />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>
      <Testimonials />
      <CtaBand title="从一个目的地开始，沉淀可复制的 AI 文旅样板" desc="用真实场景验证价值，用数据报告支撑汇报，用内容资产延续传播。" onDemo={onDemo} />
    </>
  );
}

function TraveloguePage({ onDemo }) {
  return (
    <>
      <Hero pageKey="travelogue" title={pages.travelogue.hero.title} titleLines={pages.travelogue.hero.titleLines} desc={pages.travelogue.hero.desc} primary="体验游记生成" secondary="查看样板" onDemo={onDemo} />
      <FlowSection title="5 步生成一段会被记住的旅行故事" steps={travelogueSteps.map((step) => step.title)} detailedSteps={travelogueSteps} />
      <section className="section">
        <SectionHeader title="适合谁用" desc="从家庭旅行、学生研学到景区活动，让参与者留下可保存、可分享的成果。" />
        <div className="audience-grid">
          {audienceCards.map((card, index) => (
            <article className="audience-card" key={card.title}>
              <IconBubble icon={[Users, BookOpen, Building2, Camera][index]} />
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <img src={[visualReferences.travelogue, visualReferences.scenarios, visualReferences.pilots, visualReferences.solutions][index]} alt="" />
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeader title="真实生成效果" desc="同一次旅程可以沉淀为纪念、学习、传播和汇报多种内容载体。" />
        <div className="output-grid">
          {travelogueOutputs.map((item, index) => (
            <article className="output-card" key={item.title}>
              <img
                src={[
                  visualReferences.generatedTravelogue,
                  visualReferences.generatedContentOperation,
                  visualReferences.generatedQrGuide,
                  visualReferences.generatedProductUi
                ][index % 4]}
                alt=""
              />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBand title="让一次旅行，从到访变成可以带走的故事。" desc="照片会散落，故事会留下；星河寻境让游客内容成为目的地的二次传播资产。" onDemo={onDemo} />
    </>
  );
}

function AboutPage({ onDemo }) {
  return (
    <>
      <Hero pageKey="about" title="关于星河寻境" desc="我们专注于 AI 文旅内容资产化、数字体验和运营增长，帮助地方文化资源从“被保存”走向“被讲述、被体验、被传播、被持续运营”。" primary="预约样板沟通" secondary="查看样板案例" onDemo={onDemo} />
      <AboutPanel expanded />
      <ContactSection onDemo={onDemo} />
      <FaqSection />
    </>
  );
}

function FlowSection({ title, steps, detailedSteps }) {
  return (
    <section className="section flow-section">
      <SectionHeader title={title} />
      <div className="flow-row">
        {steps.map((step, index) => (
          <div className="flow-step" key={step}>
            <IconBubble icon={[UploadCloud, Bot, FileText, PenLine, Share2, BarChart3, Database][index % 7]} />
            <h3>{typeof step === 'string' ? step : step.title}</h3>
            {detailedSteps ? <p>{detailedSteps[index].desc}</p> : <p>{['洞察需求', '形成内容', '触达游客', '沉淀资产'][index % 4]}</p>}
            {index < steps.length - 1 ? <ChevronRight className="flow-arrow" size={18} aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function SupportBand() {
  return (
    <section className="section support-band">
      <div className="support-items">
        {[
          ['内容安全', '知识来源与发布审核'],
          ['合规部署', '按客户要求配置权限与环境'],
          ['稳定上线', '小样板到多场景持续扩展'],
          ['开放集成', '对接现有小程序、官网和活动入口'],
          ['运营支持', '内容更新、数据复盘和报告输出']
        ].map(([title, desc]) => (
          <div className="support-item" key={title}>
            <IconBubble icon={ShieldCheck} />
            <strong>{title}</strong>
            <span>{desc}</span>
          </div>
        ))}
      </div>
      <div className="support-cta">
        <h2>从样板上线到长期运营，我们一起把成果做实。</h2>
        <p>围绕内容、体验、传播和报告，持续服务项目复制与复盘。</p>
      </div>
    </section>
  );
}

function ContactSection({ onDemo }) {
  return (
    <section className="section contact-section" id="contact">
      <div className="contact-form-card">
        <SectionHeader align="left" title="预约样板沟通" desc="留下你的目的地或项目场景，我们会准备对应的演示路径。" />
        <InlineLeadForm />
      </div>
      <div className="contact-info-card">
        <SectionHeader align="left" title="联系我们" desc="面向文旅局、景区、展馆、研学、出版与公益项目提供样板共创。" />
        <ul className="contact-list">
          <li><Phone size={20} /> 商务合作：4001108776</li>
          <li><Mail size={20} /> bd@xingheseek.com</li>
          <li><MapPin size={20} /> 北京市海淀区中关村软件园2号楼</li>
          <li><Clock3 size={20} /> 周一至周五 9:00 - 18:00</li>
        </ul>
        <button className="primary-button" type="button" onClick={onDemo}>
          预约沟通
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

function InlineLeadForm({ compact = false, onSuccess }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const lead = {
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      company: String(formData.get('company') || ''),
      type: String(formData.get('type') || ''),
      message: String(formData.get('message') || '')
    };

    try {
      await submitLead(lead, { source: compact ? 'demo-modal' : 'contact-section' });
      setSubmitted(true);
      onSuccess?.();
    } catch {
      setError('提交暂时失败，请拨打 4001108776 或稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="success-state" role="status">
        <CheckCircle2 size={34} />
        <strong>已收到样板沟通需求</strong>
        <p>我们会在 1 个工作日内联系，确认场景资源、演示路径和样板切入点。</p>
      </div>
    );
  }

  return (
    <form className={compact ? 'lead-form lead-form--compact' : 'lead-form'} onSubmit={handleSubmit}>
      <label>
        联系人姓名
        <input name="name" required placeholder="请输入姓名" />
      </label>
      <label>
        联系电话
        <input name="phone" required placeholder="请输入手机号" />
      </label>
      <label>
        单位名称
        <input name="company" required placeholder="请输入单位名称" />
      </label>
      <label>
        合作类型
        <select name="type" required defaultValue="">
          <option value="" disabled>
            请选择合作类型
          </option>
          <option value="城市 AI 文旅样板">城市 AI 文旅样板</option>
          <option value="景区 AI 导览样板">景区 AI 导览样板</option>
          <option value="展馆/博物馆讲解样板">展馆/博物馆讲解样板</option>
          <option value="研学/出版扫码伴读">研学/出版扫码伴读</option>
        </select>
      </label>
      <label className="form-wide">
        项目描述
        <textarea name="message" maxLength="500" placeholder="请简要描述目的地、资源基础或想先验证的样板场景（选填）" />
      </label>
      {error ? (
        <p className="form-error form-wide" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-button form-wide" type="submit" disabled={submitting}>
        {submitting ? '提交中...' : '提交样板需求'}
      </button>
    </form>
  );
}

function FaqSection() {
  return (
    <section className="section faq-section">
      <SectionHeader title="常见问题" desc="围绕样板共创、上线周期和运营支持的常见问题。" />
      <div className="faq-grid">
        {faqs.map((faq) => (
          <article className="faq-item" key={faq.question}>
            <span>Q</span>
            <div>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutPanel({ expanded = false }) {
  return (
    <section className="section about-panel">
      <div className="about-image">
        <img src={visualReferences.aiPlatform} alt="星河寻境目的地 AI 叙事系统示意" />
      </div>
      <div className="about-copy">
        <SectionHeader align="left" title="关于北京星河卓越科技有限公司" />
        <p>
          星河寻境面向地方文旅、景区、展馆、研学、出版和公益场景，提供目的地 AI 叙事与内容运营系统。
          我们把文旅知识库、图片视频库、AI 旅伴、扫码伴读、多媒体游记和传播数据报告组合成可上线的样板。
        </p>
        {expanded ? (
          <p>
            我们更关注客户能否把资源讲清楚、让游客参与进来、把体验带走，并形成可汇报、可复盘、可复制的成果。
            因此每个项目都会从一个明确场景开始，逐步沉淀为长期可运营的内容资产。
          </p>
        ) : null}
        <div className="about-stats">
          {homeMetrics.map((metric) => (
            <span key={metric.label}>
              <strong>{metric.value}</strong>
              {metric.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PilotPreview() {
  return (
    <section className="section pilot-preview">
      <SectionHeader title="从一个样板到多场景复制" desc="每个项目都沉淀为可复用的知识、入口、内容和传播报告。" />
      <div className="preview-cards">
        {pilotCases.slice(0, 5).map((item) => (
          <article key={item.title}>
            <img src={item.image} alt="" />
            <strong>{item.title}</strong>
            <span>{item.metrics[0]}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function DouyinLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M17.2 7.1v12.2a5.5 5.5 0 1 1-4.9-5.5" fill="none" stroke="#00f2ea" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <path d="M20.2 7.1c.6 3.7 2.8 6 6.2 6.7" fill="none" stroke="#ff0050" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <path d="M18.8 7.1v12.2a5.5 5.5 0 1 1-4.9-5.5" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      <path d="M20.2 7.1c.6 3.7 2.8 6 6.2 6.7" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

function ChannelsLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M10.5 11.1c2.1-2 5.5-2 7.6 0l3.4 3.2a5 5 0 0 1 0 7.3c-2.1 2-5.5 2-7.6 0l-3.4-3.2a5 5 0 0 1 0-7.3Z" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <path d="M21.5 20.9c-2.1 2-5.5 2-7.6 0l-3.4-3.2a5 5 0 0 1 0-7.3c2.1-2 5.5-2 7.6 0l3.4 3.2a5 5 0 0 1 0 7.3Z" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" opacity=".82" />
      <path d="m15.2 12.6 5.6 3.4-5.6 3.4v-6.8Z" fill="#fff" />
    </svg>
  );
}

function WeiboLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M24.3 13.8c1.8 1.3 2.7 3 2.4 4.9-.5 4.2-5.4 7.1-11.2 6.4-5.7-.7-9.9-4.6-9.4-8.8.4-3.6 4.1-5.7 8.1-6 .7-2 2.2-4.2 4.5-4 2 .2 2 2.1 1.5 3.8 1.4-.2 3-.1 4.1 3.7Z" fill="#fff" />
      <path d="M25.5 7.4c1.9.6 3.4 2.2 3.8 4.2" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M23.7 10.4c.9.3 1.7 1 1.9 2" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="1.7" />
      <ellipse cx="15.5" cy="17.6" fill="#e93b32" rx="6.1" ry="4.5" transform="rotate(-7 15.5 17.6)" />
      <circle cx="13.5" cy="17.4" r="1.1" fill="#fff" />
      <circle cx="17.1" cy="16.8" r=".8" fill="#fff" />
      <path d="M12.7 20c1.7 1 4.3.8 5.7-.5" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="1.1" />
    </svg>
  );
}

function Testimonials() {
  return (
    <section className="section testimonials">
      <SectionHeader title="合作反馈" desc="客户更关心样板是否能上线、能汇报、能继续运营。" />
      <div className="testimonial-grid">
        {testimonials.map((item) => (
          <article className="testimonial-card" key={item.name}>
            <div className="avatar">{item.name.slice(0, 1)}</div>
            <strong>{item.name}</strong>
            <p>{item.text}</p>
            <span>★★★★★</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function CtaBand({ title, desc, onDemo }) {
  return (
    <section className="cta-band">
      <div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      <div className="cta-actions">
        <button className="primary-button" type="button" onClick={onDemo}>
          预约样板
          <ArrowRight size={18} />
        </button>
        <button className="secondary-button" type="button">
          <Download size={18} />
          获取资料
        </button>
      </div>
    </section>
  );
}

function DemoModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="demo-modal" role="dialog" aria-labelledby="demo-title">
        <button className="modal-close" type="button" aria-label="关闭预约表单" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="modal-copy">
          <p className="section-eyebrow">预约样板演示</p>
          <h2 id="demo-title">告诉我们你的目的地场景</h2>
          <p>我们会基于城市、景区、展馆、研学或出版需求，准备对应样板演示路径。</p>
        </div>
        <InlineLeadForm compact onSuccess={() => {}} />
      </section>
    </div>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <a className="brand-link" href="#home" onClick={(event) => {
          event.preventDefault();
          onNavigate('home');
        }}>
          <img src={brand.logo} alt={brand.name} />
        </a>
        <p>让目的地被讲述、被体验、被传播、被持续运营。</p>
        <div className="socials" aria-label="关注我们">
          <span className="social-icon social-icon--douyin" aria-label="抖音" role="img"><DouyinLogo /></span>
          <span className="social-icon social-icon--channels" aria-label="视频号" role="img"><ChannelsLogo /></span>
          <span className="social-icon social-icon--weibo" aria-label="微博" role="img"><WeiboLogo /></span>
        </div>
      </div>
      <div className="footer-columns">
        <div>
          <strong>产品</strong>
          <a href="#capabilities">产品能力</a>
          <a href="#travelogue">多媒体游记</a>
          <a href="#scenarios">应用场景</a>
        </div>
        <div>
          <strong>解决方案</strong>
          <a href="#solutions">文旅局解决方案</a>
          <a href="#solutions">景区 AI 旅伴方案</a>
          <a href="#solutions">研学出版方案</a>
        </div>
        <div>
          <strong>关于我们</strong>
          <a href="#about">公司介绍</a>
          <a href="#contact">联系我们</a>
          <a href="#pilots">案例中心</a>
        </div>
      </div>
      <div className="footer-contact">
        <Phone size={24} />
        <strong>4001108776</strong>
        <span>工作日 9:00-18:00</span>
      </div>
      <div className="footer-bottom">
        <span>© 2024 北京星河卓越科技有限公司</span>
        <span>京ICP备2024012345号-1</span>
        <span>隐私政策</span>
        <span>服务条款</span>
      </div>
    </footer>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState(routeFromHash);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setActivePage(routeFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const activeNav = useMemo(() => navItems.find((item) => item.page === activePage) || navItems[0], [activePage]);

  const navigate = (page) => {
    const item = navItems.find((navItem) => navItem.page === page) || navItems[0];
    window.history.pushState(null, '', item.href);
    setActivePage(item.page);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo?.(0, 0);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'capabilities':
        return <CapabilitiesPage onDemo={() => setDemoOpen(true)} />;
      case 'scenarios':
        return <ScenariosPage onDemo={() => setDemoOpen(true)} />;
      case 'solutions':
        return <SolutionsPage onDemo={() => setDemoOpen(true)} />;
      case 'pilots':
        return <PilotsPage onDemo={() => setDemoOpen(true)} />;
      case 'travelogue':
        return <TraveloguePage onDemo={() => setDemoOpen(true)} />;
      case 'about':
        return <AboutPage onDemo={() => setDemoOpen(true)} />;
      case 'home':
      default:
        return <HomePage onDemo={() => setDemoOpen(true)} />;
    }
  };

  return (
    <div className="app-shell">
      <Header activePage={activeNav.page} onNavigate={navigate} onDemo={() => setDemoOpen(true)} />
      <main>{renderPage()}</main>
      <Footer onNavigate={navigate} />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
