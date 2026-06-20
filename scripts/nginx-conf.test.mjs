import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nginxConfigPath = path.join(root, 'ops', 'nginx.conf');

describe('production nginx configuration', () => {
  test('serves hashed assets with a single explicit immutable cache policy', () => {
    const config = fs.readFileSync(nginxConfigPath, 'utf8');

    expect(config).toContain('add_header Cache-Control "public, max-age=2592000, immutable" always;');
    expect(config).not.toContain('expires 30d;');
  });
});
