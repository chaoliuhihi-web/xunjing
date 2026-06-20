import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, test } from 'vitest';
import { publishGiteePagesArtifact } from './publish-gitee-pages.mjs';

const execFile = promisify(execFileCallback);
const tempDirs = [];

function makeTempDir() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xinghe-pages-publish-test-'));
  tempDirs.push(tempDir);
  return tempDir;
}

function makeArtifactFixture() {
  const artifactDir = path.join(makeTempDir(), 'artifact');
  fs.mkdirSync(path.join(artifactDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'index.html'), '<!doctype html><title>星河寻境</title>');
  fs.writeFileSync(path.join(artifactDir, '404.html'), '<!doctype html><title>星河寻境</title>');
  fs.writeFileSync(path.join(artifactDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(artifactDir, '.spa'), '');
  fs.writeFileSync(path.join(artifactDir, 'assets', 'index.js'), 'console.log("ok");');
  return artifactDir;
}

async function makeBareRemote() {
  const remoteDir = path.join(makeTempDir(), 'remote.git');
  await execFile('git', ['init', '--bare', remoteDir]);
  return remoteDir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Gitee Pages artifact publisher', () => {
  test('publishes an artifact directory to a dedicated gh-pages branch', async () => {
    const artifactDir = makeArtifactFixture();
    const remoteUrl = await makeBareRemote();

    const result = await publishGiteePagesArtifact({
      artifactDir,
      remoteUrl,
      branch: 'gh-pages',
      commitMessage: 'deploy test artifact'
    });

    expect(result).toMatchObject({
      branch: 'gh-pages',
      files: expect.any(Number)
    });

    const cloneDir = path.join(makeTempDir(), 'clone');
    await execFile('git', ['clone', '--branch', 'gh-pages', remoteUrl, cloneDir]);

    expect(fs.existsSync(path.join(cloneDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(cloneDir, '404.html'))).toBe(true);
    expect(fs.existsSync(path.join(cloneDir, '.nojekyll'))).toBe(true);
    expect(fs.existsSync(path.join(cloneDir, '.spa'))).toBe(true);
    expect(fs.existsSync(path.join(cloneDir, 'assets', 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(cloneDir, 'package.json'))).toBe(false);
  });

  test('refuses to publish when the artifact has no index.html', async () => {
    const artifactDir = path.join(makeTempDir(), 'artifact');
    fs.mkdirSync(artifactDir, { recursive: true });
    const remoteUrl = await makeBareRemote();

    await expect(publishGiteePagesArtifact({
      artifactDir,
      remoteUrl,
      branch: 'gh-pages'
    })).rejects.toThrow('Missing artifact index');
  });
});
