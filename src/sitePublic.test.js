import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('public deployment assets', () => {
  test('exposes health check metadata for uptime probes', () => {
    const healthPath = path.join(root, 'public', 'healthz.json');
    const health = JSON.parse(fs.readFileSync(healthPath, 'utf8'));

    expect(health).toMatchObject({
      status: 'ok',
      service: 'xinghexunjing-web'
    });
    expect(health.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('exposes a sitemap with the public route anchors used by the SPA', () => {
    const sitemap = fs.readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8');

    for (const anchor of ['#home', '#capabilities', '#scenarios', '#solutions', '#pilots', '#travelogue', '#about']) {
      expect(sitemap).toContain(`/${anchor}`);
    }
  });

  test('declares production SEO and social sharing metadata', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const robots = fs.readFileSync(path.join(root, 'public', 'robots.txt'), 'utf8');
    const socialImage = fs.readFileSync(path.join(root, 'public', 'social-share.svg'), 'utf8');

    expect(html).toContain('<link rel="canonical" href="https://xinghetech.gitee.io/xinghexunjing/" />');
    expect(html).toContain('<meta property="og:url" content="https://xinghetech.gitee.io/xinghexunjing/" />');
    expect(html).toContain('<meta property="og:image" content="https://xinghetech.gitee.io/xinghexunjing/social-share.svg" />');
    expect(html).toContain('<meta property="og:image:width" content="1200" />');
    expect(html).toContain('<meta property="og:image:height" content="630" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(robots).toContain('Sitemap: https://xinghetech.gitee.io/xinghexunjing/sitemap.xml');
    expect(socialImage).toContain('viewBox="0 0 1200 630"');
  });
});
