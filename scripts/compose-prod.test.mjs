import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const composePath = path.join(root, 'ops', 'compose.prod.yml');

describe('production compose configuration', () => {
  test('defines a restartable web service with runtime lead webhook configuration', () => {
    const compose = fs.readFileSync(composePath, 'utf8');

    expect(compose).toContain('name: xinghexunjing');
    expect(compose).toContain('xinghexunjing-web:');
    expect(compose).toContain('restart: unless-stopped');
    expect(compose).toContain('${XINGHE_WEB_PORT:-8080}:80');
    expect(compose).toContain('XINGHE_LEAD_WEBHOOK_URL=${XINGHE_LEAD_WEBHOOK_URL:-}');
  });

  test('builds from the repository Dockerfile and exposes a container healthcheck', () => {
    const compose = fs.readFileSync(composePath, 'utf8');

    expect(compose).toContain('context: ..');
    expect(compose).toContain('dockerfile: Dockerfile');
    expect(compose).toContain('CMD-SHELL');
    expect(compose).toContain('http://127.0.0.1/healthz.json');
  });
});
