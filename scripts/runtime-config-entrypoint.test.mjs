import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const root = process.cwd();
const entrypointPath = path.join(root, 'ops', 'docker-entrypoint.d', '40-render-runtime-config.sh');
const tempDirs = [];

function makeTempDir() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xinghe-runtime-config-'));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('runtime config Docker entrypoint', () => {
  test('renders lead webhook URL from environment for production containers', async () => {
    const outputPath = path.join(makeTempDir(), 'runtime-config.js');

    await execFile('sh', [entrypointPath], {
      env: {
        ...process.env,
        XINGHE_RUNTIME_CONFIG_FILE: outputPath,
        XINGHE_LEAD_WEBHOOK_URL: 'https://crm.example.com/api/xinghe/leads'
      }
    });

    const config = fs.readFileSync(outputPath, 'utf8');
    expect(config).toContain('window.XINGHE_SITE_CONFIG');
    expect(config).toContain('https://crm.example.com/api/xinghe/leads');
  });

  test('rejects non-HTTPS lead webhooks to avoid mixed-content production setups', async () => {
    const outputPath = path.join(makeTempDir(), 'runtime-config.js');

    await expect(execFile('sh', [entrypointPath], {
      env: {
        ...process.env,
        XINGHE_RUNTIME_CONFIG_FILE: outputPath,
        XINGHE_LEAD_WEBHOOK_URL: 'http://crm.example.com/api/xinghe/leads'
      }
    })).rejects.toMatchObject({
      stderr: expect.stringContaining('must be empty or start with https://')
    });
    expect(fs.existsSync(outputPath)).toBe(false);
  });

  test('Dockerfile installs the runtime config entrypoint into the Nginx image', () => {
    const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');

    expect(dockerfile).toContain('ops/docker-entrypoint.d/40-render-runtime-config.sh');
    expect(dockerfile).toContain('/docker-entrypoint.d/40-render-runtime-config.sh');
  });
});
