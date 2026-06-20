import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { prepareGiteePagesArtifact } from './prepare-gitee-pages.mjs';

const tempDirs = [];

function makeTempDir() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xinghe-gitee-pages-test-'));
  tempDirs.push(tempDir);
  return tempDir;
}

function makeDistFixture() {
  const tempDir = makeTempDir();
  const distDir = path.join(tempDir, 'dist');
  fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
  fs.writeFileSync(
    path.join(distDir, 'index.html'),
    '<!doctype html><script src="/xinghexunjing/runtime-config.js"></script><script type="module" src="/xinghexunjing/assets/index.js"></script>'
  );
  fs.writeFileSync(path.join(distDir, 'runtime-config.js'), 'window.XINGHE_SITE_CONFIG = { leadWebhookUrl: "" };');
  fs.writeFileSync(path.join(distDir, 'healthz.json'), '{"status":"ok","service":"xinghexunjing-web"}');
  fs.writeFileSync(path.join(distDir, 'assets', 'index.js'), 'console.log("ok");');
  return distDir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Gitee Pages artifact preparation', () => {
  test('copies subpath build files and writes static-hosting guards', () => {
    const distDir = makeDistFixture();
    const outDir = path.join(makeTempDir(), 'gitee-pages');

    const result = prepareGiteePagesArtifact({
      distDir,
      outDir,
      basePath: '/xinghexunjing/',
      commit: 'abc1234',
      leadWebhookUrl: 'https://crm.example.cn/xinghe/leads'
    });

    expect(result).toMatchObject({
      outDir,
      basePath: '/xinghexunjing/',
      commit: 'abc1234'
    });
    expect(fs.existsSync(path.join(outDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '404.html'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.nojekyll'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.spa'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'assets', 'index.js'))).toBe(true);

    const runtimeConfig = fs.readFileSync(path.join(outDir, 'runtime-config.js'), 'utf8');
    expect(runtimeConfig).toContain('window.XINGHE_SITE_CONFIG');
    expect(runtimeConfig).toContain('https://crm.example.cn/xinghe/leads');

    const readme = fs.readFileSync(path.join(outDir, 'README.md'), 'utf8');
    expect(readme).toContain('commit: abc1234');
    expect(readme).toContain('basePath: /xinghexunjing/');
    expect(readme).toContain('deployUrl: https://xinghetech.gitee.io/xinghexunjing/');
  });

  test('rejects non-HTTPS lead webhook URLs', () => {
    const distDir = makeDistFixture();
    const outDir = path.join(makeTempDir(), 'gitee-pages');

    expect(() => prepareGiteePagesArtifact({
      distDir,
      outDir,
      basePath: '/xinghexunjing/',
      commit: 'abc1234',
      leadWebhookUrl: 'http://crm.example.cn/xinghe/leads'
    })).toThrow('leadWebhookUrl must be empty or start with https://');
  });
});
