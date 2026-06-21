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
  MessageCircle,
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
  home: ['文旅内容中台', 'AI 智能运营', '一体化生态'],
  capabilities: ['平台能力网格', 'AI 生成效率', '持续增长看板'],
  scenarios: ['景区导览', '扫码伴读', '研学传播'],
  solutions: ['文旅局方案', '景区方案', '博物馆方案'],
  pilots: ['样板交付', '方法论复用', '多地复制'],
  travelogue: ['智能拍摄', '内容复用', '分享闭环'],
  about: ['品牌资产', '产品交付', '长期运营']
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
        <img src={brand.logo} alt="" />
        <span>
          <strong>{brand.name}</strong>
          <small>{brand.subtitle}</small>
        </span>
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
          预约演示
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

function Hero({ pageKey, eyebrow, title, desc, primary = '预约演示', secondary = '观看平台介绍', onDemo }) {
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

  return (
    <section className={`hero hero--${pageKey}`}>
      <div className="hero-motion-layer" aria-hidden="true">
        <span className="speed-line speed-line--a" />
        <span className="speed-line speed-line--b" />
        <span className="mist mist--a" />
        <span className="mist mist--b" />
      </div>
      <span className="hero-glow-ring" aria-hidden="true" />
      <div className="hero-copy">
        {eyebrow ? <p className="hero-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
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
      <div className="hero-art" aria-hidden="true">
        <img src={refMap[pageKey]} alt="" />
        <div className="hero-glass hero-glass--one">
          <IconBubble icon={Bot} />
          <span>AI 旅伴</span>
        </div>
        <div className="hero-glass hero-glass--two">
          <IconBubble icon={Database} tone="cyan" />
          <span>数据运营</span>
        </div>
        <div className="hero-glass hero-glass--three">
          <IconBubble icon={MapPinned} tone="violet" />
          <span>扫码伴读</span>
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
          <IconBubble icon={card.icon} />
          <h3>{card.title}</h3>
          <p>{card.desc}</p>
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
        <SectionHeader align="left" title="行业痛点" desc="从资源、内容、体验、传播到转化，文旅运营需要一个能持续沉淀资产的系统。" />
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
          <SectionHeader align="left" title="核心产品矩阵" desc="围绕内容、知识、数据、运营和开放集成形成可复制的平台能力。" />
          <a className="text-link" href="#capabilities">
            了解产品能力 <ArrowRight size={16} />
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
        <SectionHeader align="left" title="数据能力" desc="把内容生产、游客触达和运营效果连成闭环。" />
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
        title="携手星河寻境，让每一处风景被看见，让每一次旅行更美好"
        desc="开启文旅数字化新篇章，共建智慧文旅新生态。"
        onDemo={onDemo}
      />
    </>
  );
}

function ProductShowcase() {
  const [active, setActive] = useState('总览大屏');
  const tabs = ['总览大屏', '内容管理', '数据分析', '游记管理', '知识库', '活动运营'];

  return (
    <section className="section product-showcase">
      <SectionHeader title="产品界面展示" desc="用真实平台界面承载内容、运营、数据和 AI 能力，而不是停留在概念图。" />
      <div className="tabs" role="tablist" aria-label="产品界面类型">
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
          <img src={visualReferences.mobileProduct} alt="星河寻境移动端产品界面" />
        </div>
        <div className="showcase-caption">
          <strong>{active}</strong>
          <span>多端协同、内容资产化、运营数据可视化</span>
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
        desc={pages.capabilities.hero.desc}
        primary="预约产品演示"
        secondary="下载产品白皮书"
        onDemo={onDemo}
      />
      <MetricsStrip
        items={[
          { value: '283+', label: '合作城市/景区' },
          { value: '5,908+', label: '接入景区/场馆' },
          { value: '128万+', label: '注册用户' },
          { value: '4,200万+', label: '内容生成量' },
          { value: '98.6%', label: '用户满意度' }
        ]}
      />
      <section className="section architecture-section">
        <SectionHeader align="left" title="平台架构" desc="从基础设施到应用触达，形成可治理、可扩展的文旅内容运营平台。" />
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
        <SectionHeader title="产品能力矩阵" desc="能力不是零散工具，而是可组合的业务组件。" />
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
      <FlowSection title="AI 内容生产与运营流程" steps={productionFlow} />
      <SupportBand />
    </>
  );
}

function ScenariosPage({ onDemo }) {
  return (
    <>
      <Hero pageKey="scenarios" title={pages.scenarios.hero.title} desc={pages.scenarios.hero.desc} primary="预约合作咨询" onDemo={onDemo} />
      <section className="section">
        <SectionHeader title="多元应用场景" desc="围绕城市、景区、展馆、研学和出版，把 AI 能力放进真实服务场景。" />
        <div className="scenario-grid">
          {scenarioCards.map((card) => (
            <article className="scenario-card" key={card.title}>
              <img src={card.image} alt="" />
              <div>
                <IconBubble icon={MapPinned} />
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <a href="#solutions">了解更多 <ArrowRight size={14} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <FlowSection title="合作流程" steps={cooperationSteps} />
      <ContactSection onDemo={onDemo} />
      <FaqSection />
      <AboutPanel />
    </>
  );
}

function SolutionsPage({ onDemo }) {
  return (
    <>
      <Hero pageKey="solutions" title={pages.solutions.hero.title} desc={pages.solutions.hero.desc} primary="预约方案演示" secondary="下载解决方案" onDemo={onDemo} />
      <section className="section solution-section">
        <div className="solution-grid">
          {solutionTracks.map((track) => (
            <article className={`solution-card solution-card--${track.accent}`} key={track.title}>
              <IconBubble icon={Building2} tone={track.accent} />
              <h3>{track.title}</h3>
              <div className="solution-block">
                <strong>核心问题</strong>
                <ul>
                  {track.problem.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="solution-block">
                <strong>交付模块</strong>
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
        <SectionHeader title="平台能力组件" desc="按项目组合，快速从样板复制到多地运营。" />
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
      <CtaBand title="让每一座城市的文化被看见，让每一次旅行更有温度。" desc="星河寻境，与你共建文旅内容新未来。" onDemo={onDemo} />
    </>
  );
}

function PilotsPage({ onDemo }) {
  return (
    <>
      <Hero pageKey="pilots" title={pages.pilots.hero.title} desc={pages.pilots.hero.desc} primary="预约演示" secondary="咨询专家" onDemo={onDemo} />
      <section className="section">
        <SectionHeader title="精选 AI 文旅样板" desc="从项目中沉淀方法，从实践中验证价值。" />
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
              <a href="#scenarios">查看详情 <ArrowRight size={14} /></a>
            </article>
          ))}
        </div>
      </section>
      <section className="section stats-section">
        <SectionHeader title="样板成效总览" desc="已落地项目平均数据，持续用于方案迭代。" />
        <div className="pilot-stat-grid">
          {pilotStats.map((item) => (
            <div className="stat-card" key={item.label}>
              <strong>↑ {item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>
      <FlowSection title="我们的方法论：从验证到复制的五步路线" steps={methodology} />
      <section className="section">
        <SectionHeader title="可复用资产与模块" desc="沉淀开箱即用的能力，让复制更高效。" />
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
      <CtaBand title="从您的目的地开始，打造专属 AI 文旅样板" desc="立即联系我们，获取定制化方案与落地支持。" onDemo={onDemo} />
    </>
  );
}

function TraveloguePage({ onDemo }) {
  return (
    <>
      <Hero pageKey="travelogue" title={pages.travelogue.hero.title} desc={pages.travelogue.hero.desc} primary="立即体验" secondary="了解更多" onDemo={onDemo} />
      <FlowSection title="轻松 5 步，生成你的专属游记" steps={travelogueSteps.map((step) => step.title)} detailedSteps={travelogueSteps} />
      <section className="section">
        <SectionHeader title="适合谁用" desc="从家庭旅行到研学实践，把每一次行走都变成可收藏的内容资产。" />
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
        <SectionHeader title="真实生成效果" desc="同一次旅程可以生成不同载体，覆盖记录、收藏、传播和研学成果。" />
        <div className="output-grid">
          {travelogueOutputs.map((item, index) => (
            <article className="output-card" key={item.title}>
              <img src={[visualReferences.productBoard, visualReferences.travelogue, visualReferences.mobileProduct][index % 3]} alt="" />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBand title="让每一次旅行都值得被记录和珍藏" desc="AI 帮你记录当下、留住回忆、分享美好、传递价值。" onDemo={onDemo} />
    </>
  );
}

function AboutPage({ onDemo }) {
  return (
    <>
      <Hero pageKey="about" title="关于星河寻境" desc="我们专注于 AI 文旅内容资产化、数字体验和运营增长，帮助目的地把文化资源转化为长期价值。" primary="预约沟通" secondary="查看案例" onDemo={onDemo} />
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
          ['数据安全', '多层数据与隐私保护'],
          ['合规认证', '等保/ISO/隐私认证适配'],
          ['高可用架构', '支持专有云与私有化'],
          ['开放生态', 'API/SDK/插件市场'],
          ['专业服务', '7x24 小时技术支持']
        ].map(([title, desc]) => (
          <div className="support-item" key={title}>
            <IconBubble icon={ShieldCheck} />
            <strong>{title}</strong>
            <span>{desc}</span>
          </div>
        ))}
      </div>
      <div className="support-cta">
        <h2>携手领先文旅企业，共建智慧文旅新生态</h2>
        <p>已助力 283+ 城市/景区实现数字化升级。</p>
      </div>
    </section>
  );
}

function ContactSection({ onDemo }) {
  return (
    <section className="section contact-section" id="contact">
      <div className="contact-form-card">
        <SectionHeader align="left" title="预约演示 / 合作咨询" desc="请留下信息，我们将在 1 个工作日内与你沟通。" />
        <InlineLeadForm />
      </div>
      <div className="contact-info-card">
        <SectionHeader align="left" title="联系我们" desc="面向城市、景区、展馆、研学和出版单位提供样板共创。" />
        <ul className="contact-list">
          <li><Phone size={20} /> 商务合作：010-8888-8801</li>
          <li><Mail size={20} /> bd@xingheseek.com</li>
          <li><MapPin size={20} /> 北京市海淀区中关村大街 1 号</li>
          <li><Clock3 size={20} /> 周一至周五 9:00 - 18:00</li>
        </ul>
        <button className="primary-button" type="button" onClick={onDemo}>
          快速预约
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
      setError('提交暂时失败，请拨打 400-1010-123 或稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="success-state" role="status">
        <CheckCircle2 size={34} />
        <strong>需求已记录</strong>
        <p>我们会在 1 个工作日内联系，确认场景、资料和演示时间。</p>
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
          <option value="景区 AI 导览样板">景区 AI 导览样板</option>
          <option value="城市文旅内容运营">城市文旅内容运营</option>
          <option value="展馆/博物馆数字讲解">展馆/博物馆数字讲解</option>
          <option value="研学/出版扫码伴读">研学/出版扫码伴读</option>
        </select>
      </label>
      <label className="form-wide">
        项目描述
        <textarea name="message" maxLength="500" placeholder="请简要描述您的需求或项目情况（选填）" />
      </label>
      {error ? (
        <p className="form-error form-wide" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-button form-wide" type="submit" disabled={submitting}>
        {submitting ? '提交中...' : '提交需求'}
      </button>
    </form>
  );
}

function FaqSection() {
  return (
    <section className="section faq-section">
      <SectionHeader title="常见问题" desc="为您解答合作过程中常见的问题。" />
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
        <img src={visualReferences.aiPlatform} alt="星河寻境 AI 中台能力示意" />
      </div>
      <div className="about-copy">
        <SectionHeader align="left" title="关于北京星河卓越科技有限公司" />
        <p>
          星河寻境面向地方文旅、景区、展馆、研学和出版场景，提供 AI 内容生产、知识库建设、
          多端导览、扫码伴读和数据运营能力，帮助客户从一次项目沉淀为长期可复用的内容资产。
        </p>
        {expanded ? (
          <p>
            第一阶段官网聚焦对外运营和客户转化，后续可继续接入真实 CRM、案例库、内容管理后台、
            数据看板和在线试用账号体系。
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
      <SectionHeader title="从试点样板到多地复制" desc="每个项目都沉淀为可复用的方法、资产和数据指标。" />
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

function Testimonials() {
  return (
    <section className="section testimonials">
      <SectionHeader title="客户评价" desc="来自合作伙伴的真实反馈。" />
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
          预约演示
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
          <p className="section-eyebrow">预约演示</p>
          <h2 id="demo-title">告诉我们你的文旅场景</h2>
          <p>我们将基于城市、景区、展馆、研学或出版需求，准备对应演示路径。</p>
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
          <img src={brand.logo} alt="" />
          <span>
            <strong>{brand.name}</strong>
            <small>{brand.subtitle}</small>
          </span>
        </a>
        <p>AI 让地方文旅资源更有价值，让每一次旅行更有温度。</p>
        <div className="socials" aria-label="关注我们">
          <span><MessageCircle size={18} /></span>
          <span>抖</span>
          <span>视</span>
          <span>博</span>
        </div>
      </div>
      <div className="footer-columns">
        <div>
          <strong>产品</strong>
          <a href="#capabilities">产品能力</a>
          <a href="#travelogue">跟着游记</a>
          <a href="#scenarios">应用场景</a>
        </div>
        <div>
          <strong>解决方案</strong>
          <a href="#solutions">文旅局解决方案</a>
          <a href="#solutions">景区数字化方案</a>
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
        <strong>400-1010-123</strong>
        <span>工作日 9:00-18:00</span>
      </div>
      <div className="footer-bottom">
        <span>© 2024 星河寻境（北京）科技有限公司</span>
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
