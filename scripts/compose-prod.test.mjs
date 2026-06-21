import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const composePath = path.join(root, 'ops', 'compose.prod.yml');
const dockerignorePath = path.join(root, '.dockerignore');
const dockerfilePath = path.join(root, 'Dockerfile');

describe('production compose configuration', () => {
  test('defines a restartable web service with runtime lead webhook configuration', () => {
    const compose = fs.readFileSync(composePath, 'utf8');

    expect(compose).toContain('name: xinghexunjing');
    expect(compose).toContain('xinghexunjing-web:');
    expect(compose).toContain('restart: unless-stopped');
    expect(compose).toContain('${XINGHE_WEB_PORT:-8080}:80');
    expect(compose).toContain('XINGHE_LEAD_WEBHOOK_URL=${XINGHE_LEAD_WEBHOOK_URL:-/api/leads}');
    expect(compose).toContain('./nginx.compose.conf:/etc/nginx/conf.d/default.conf:ro');
  });

  test('builds from the repository Dockerfile and exposes a container healthcheck', () => {
    const compose = fs.readFileSync(composePath, 'utf8');

    expect(compose).toContain('context: ..');
    expect(compose).toContain('dockerfile: Dockerfile');
    expect(compose).toContain('CMD-SHELL');
    expect(compose).toContain('http://127.0.0.1/healthz.json');
  });

  test('runs a restartable local lead capture service with persistent storage', () => {
    const compose = fs.readFileSync(composePath, 'utf8');

    expect(compose).toContain('xinghexunjing-leads:');
    expect(compose).toContain('image: node:20-alpine');
    expect(compose).toContain('node /app/services/lead-capture-server.mjs');
    expect(compose).toContain('XINGHE_LEADS_FILE=/data/leads.jsonl');
    expect(compose).toContain('xinghexunjing-leads-data:/data');
    expect(compose).toContain('http://127.0.0.1:3000/healthz');
    expect(compose).toContain('xinghexunjing-leads-data:');
  });

  test('keeps the Docker build context small while including deployment SQL contracts', () => {
    const dockerignore = fs.readFileSync(dockerignorePath, 'utf8');

    expect(dockerignore).toContain('backend/yudao/sql/mysql/*');
    expect(dockerignore).toContain('!backend/yudao/sql/mysql/yudao-ai-module.sql');
    expect(dockerignore).toContain('!backend/yudao/sql/mysql/xunjing-module.sql');
    expect(dockerignore).toContain('!backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql');
    expect(dockerignore).toContain('backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/*');
  });

  test('does not run repository-wide release checks inside the minimized Docker context', () => {
    const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');

    expect(dockerfile).not.toContain('RUN npm run release:check');
    expect(dockerfile).toContain('RUN npm audit --audit-level=moderate && npm run build');
  });
});
