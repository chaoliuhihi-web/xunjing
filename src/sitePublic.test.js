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
});
