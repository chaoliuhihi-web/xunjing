import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, test } from 'vitest';

const root = process.cwd();
const tempDirs = [];
const execFile = promisify(execFileCallback);

async function buildSiteWithBasePath(basePath) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xinghe-base-path-build-'));
  tempDirs.push(outDir);

  const result = await execFile(process.execPath, [
    path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
    'build',
    '--outDir',
    outDir,
    '--emptyOutDir'
  ], {
    cwd: root,
    env: {
      ...process.env,
      VITE_BASE_PATH: basePath
    }
  });

  return {
    outDir,
    output: `${result.stdout}\n${result.stderr}`
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('static base path build', () => {
  test('builds public assets relative to the configured subpath', async () => {
    const { outDir, output } = await buildSiteWithBasePath('/xinghexunjing/');
    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');

    expect(output).not.toContain('can\'t be bundled without type="module"');
    expect(html).toContain('src="/xinghexunjing/runtime-config.js"');
    expect(html).toContain('href="/xinghexunjing/favicon.svg"');
    expect(html).toContain('href="/xinghexunjing/site.webmanifest"');
    expect(html).toMatch(/src="\/xinghexunjing\/assets\/index-[^"]+\.js"/);
    expect(html).not.toMatch(/(?:src|href)="\/(?:runtime-config\.js|favicon\.svg|site\.webmanifest|assets\/)/);
  });
});
