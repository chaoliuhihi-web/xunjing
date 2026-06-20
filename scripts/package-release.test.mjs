import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  buildReleaseManifest,
  collectReleaseEntries,
  createReleaseArchive
} from './package-release.mjs';

const root = process.cwd();
const tempDirs = [];

function makeDistFixture() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xinghe-release-test-'));
  tempDirs.push(tempDir);

  const distDir = path.join(tempDir, 'dist');
  fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.html'), '<html>星河寻境</html>');
  fs.writeFileSync(path.join(distDir, 'runtime-config.js'), 'window.XINGHE_SITE_CONFIG = {};');
  fs.writeFileSync(path.join(distDir, 'healthz.json'), '{"status":"ok"}');
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), '<urlset></urlset>');
  fs.writeFileSync(path.join(distDir, 'assets', 'index.js'), 'console.log("ok");');

  return { tempDir, distDir };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('release package builder', () => {
  test('collects deployable dist files and operational config', () => {
    const { distDir } = makeDistFixture();

    const entries = collectReleaseEntries({
      rootDir: root,
      distDir
    });

    expect(entries.map((entry) => entry.archivePath)).toEqual(
      expect.arrayContaining([
        'site/index.html',
        'site/runtime-config.js',
        'site/healthz.json',
        'site/sitemap.xml',
        'site/assets/index.js',
        'ops/nginx.conf',
        'docs/官网运营配置说明.md'
      ])
    );
  });

  test('builds a manifest with commit, generated time, and checksums', () => {
    const { distDir } = makeDistFixture();
    const entries = collectReleaseEntries({ rootDir: root, distDir });
    const manifest = buildReleaseManifest({
      commit: 'abc1234',
      generatedAt: '2026-06-21T00:00:00.000Z',
      entries
    });

    expect(manifest).toMatchObject({
      app: 'xinghexunjing-web',
      commit: 'abc1234',
      generatedAt: '2026-06-21T00:00:00.000Z'
    });
    expect(manifest.files.some((file) => file.path === 'site/index.html' && file.sha256)).toBe(true);
    expect(manifest.files.every((file) => file.bytes > 0)).toBe(true);
  });

  test('creates a versioned tarball and sidecar manifest', async () => {
    const { tempDir, distDir } = makeDistFixture();
    const outDir = path.join(tempDir, 'out');

    const result = await createReleaseArchive({
      rootDir: root,
      distDir,
      outDir,
      commit: 'abc1234',
      timestamp: '20260621-000000'
    });

    expect(fs.existsSync(result.archivePath)).toBe(true);
    expect(fs.existsSync(result.manifestPath)).toBe(true);
    expect(result.archivePath).toMatch(/xinghexunjing-web-20260621-000000-abc1234\.tar\.gz$/);
    expect(JSON.parse(fs.readFileSync(result.manifestPath, 'utf8')).commit).toBe('abc1234');
  });
});
