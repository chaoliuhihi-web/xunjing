import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nginxConfigPath = path.join(root, 'ops', 'nginx.conf');
const composeNginxConfigPath = path.join(root, 'ops', 'nginx.compose.conf');

describe('production nginx configuration', () => {
  test('serves hashed assets with a single explicit immutable cache policy', () => {
    const config = fs.readFileSync(nginxConfigPath, 'utf8');

    expect(config).toContain('add_header Cache-Control "public, max-age=2592000, immutable" always;');
    expect(config).not.toContain('expires 30d;');
  });

  test('compose nginx configuration proxies lead capture requests to the local service', () => {
    const config = fs.readFileSync(composeNginxConfigPath, 'utf8');

    expect(config).toContain('location = /api/leads');
    expect(config).toContain('proxy_pass http://xinghexunjing-leads:3000/leads;');
    expect(config).toContain('location = /api/leads/healthz');
    expect(config).toContain('proxy_pass http://xinghexunjing-leads:3000/healthz;');
    expect(config).toContain('client_max_body_size 64k;');
  });
});
