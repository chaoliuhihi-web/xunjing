import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('docker build context', () => {
  test('keeps the operation guide required by release packaging tests', () => {
    const dockerignore = fs.readFileSync(path.join(root, '.dockerignore'), 'utf8');

    expect(dockerignore).toContain('!docs/02_开发规划/官网运营配置说明.md');
  });
});
