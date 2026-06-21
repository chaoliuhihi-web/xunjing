import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const url = process.env.SMOKE_URL || 'http://localhost:5173/';
const qaDir = path.join(root, 'qa');

fs.mkdirSync(qaDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const warnings = [];

function trackPage(page, prefix = '') {
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`${prefix}${msg.text()}`);
    if (msg.type() === 'warning') warnings.push(`${prefix}${msg.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`${prefix}${error.message}`));
}

const desktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1
});
const page = await desktop.newPage();
trackPage(page);

await page.goto(url, { waitUntil: 'networkidle' });
const title = await page.title();
const bodyText = await page.locator('body').innerText();
const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
await page.screenshot({ path: path.join(qaDir, 'desktop-1440.png'), fullPage: false });

await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '产品能力' }).click();
await page.getByRole('heading', { name: /从地方资源到游客传播/ }).waitFor();
await page.getByText('从资源到传播的闭环架构').waitFor();
await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: 'AI旅伴' }).click();
await page.getByRole('heading', { name: /让游客带走的/ }).waitFor();
await page.getByText('5 步生成一段会被记住的旅行故事').waitFor();

await page.getByRole('button', { name: '预约样板' }).first().click();
await page.getByLabel('联系人姓名').fill('王女士');
await page.getByLabel('联系电话').fill('13800138000');
await page.getByLabel('单位名称').fill('新疆文旅示范中心');
await page.getByLabel('合作类型').selectOption('景区 AI 导览样板');
await page.getByRole('button', { name: '提交样板需求' }).click();
await page.getByText('已收到样板沟通需求').waitFor();
await page.screenshot({ path: path.join(qaDir, 'desktop-form-success.png'), fullPage: false });
await desktop.close();

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  deviceScaleFactor: 2
});
const mobilePage = await mobile.newPage();
trackPage(mobilePage, '[mobile] ');

await mobilePage.goto(url, { waitUntil: 'networkidle' });
const mobileOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
await mobilePage.screenshot({ path: path.join(qaDir, 'mobile-390.png'), fullPage: false });
await mobilePage.getByRole('button', { name: '打开导航' }).click();
await mobilePage.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '产品能力' }).click();
await mobilePage.getByRole('heading', { name: /从地方资源到游客传播/ }).waitFor();
await mobilePage.screenshot({ path: path.join(qaDir, 'mobile-nav-product.png'), fullPage: false });
await mobile.close();
await browser.close();

const result = {
  url,
  title,
  bodyLength: bodyText.length,
  hasHero: bodyText.includes('星河寻境') && bodyText.includes('AI 文旅内容') && bodyText.includes('让每一处风景被讲述'),
  desktopOverflow,
  mobileOverflow,
  errors,
  warnings,
  screenshots: [
    'qa/desktop-1440.png',
    'qa/desktop-form-success.png',
    'qa/mobile-390.png',
    'qa/mobile-nav-product.png'
  ]
};

console.log(JSON.stringify(result, null, 2));

if (!result.hasHero || desktopOverflow || mobileOverflow || errors.length > 0 || warnings.length > 0) {
  process.exit(1);
}
