import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { afterEach, describe, expect, test } from 'vitest';
import { createLeadCaptureServer } from '../services/lead-capture-server.mjs';

const servers = [];
const tempDirs = [];

function makeTempDir() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xinghe-leads-test-'));
  tempDirs.push(tempDir);
  return tempDir;
}

async function startServer(options) {
  const server = createLeadCaptureServer(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  servers.push(server);

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('lead capture server', () => {
  test('persists posted leads as json lines and returns an id', async () => {
    const leadsFile = path.join(makeTempDir(), 'leads.jsonl');
    const baseUrl = await startServer({ leadsFile });

    const response = await fetch(`${baseUrl}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '王女士',
        phone: '13800138000',
        company: '新疆文旅示范中心',
        type: '景区 AI 导览样板',
        message: '希望预约演示',
        source: 'website',
        status: 'new'
      })
    });

    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result).toMatchObject({ ok: true });
    expect(result.id).toMatch(/^lead_/);

    const rows = fs.readFileSync(leadsFile, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: result.id,
      status: 'new',
      lead: {
        name: '王女士',
        phone: '13800138000',
        company: '新疆文旅示范中心'
      }
    });
    expect(rows[0].receivedAt).toMatch(/T/);
  });

  test('rejects invalid lead payloads without writing a lead row', async () => {
    const leadsFile = path.join(makeTempDir(), 'leads.jsonl');
    const baseUrl = await startServer({ leadsFile });

    const response = await fetch(`${baseUrl}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', phone: '' })
    });

    expect(response.status).toBe(400);
    expect(fs.existsSync(leadsFile)).toBe(false);
  });

  test('exposes a health endpoint for compose and go-live checks', async () => {
    const leadsFile = path.join(makeTempDir(), 'leads.jsonl');
    const baseUrl = await startServer({ leadsFile });

    const response = await fetch(`${baseUrl}/healthz`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      service: 'xinghexunjing-leads'
    });
  });
});
