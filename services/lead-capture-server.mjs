import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const defaultLeadsFile = '/data/leads.jsonl';
const maxBodyBytes = 64 * 1024;

function jsonResponse(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(`${JSON.stringify(body)}\n`);
}

function methodNotAllowed(res) {
  res.writeHead(405, { Allow: 'POST' });
  res.end();
}

function normalizeString(value, maxLength = 1000) {
  if (value == null) return '';
  return String(value).trim().slice(0, maxLength);
}

function normalizeLeadPayload(input) {
  const lead = {
    name: normalizeString(input.name, 100),
    phone: normalizeString(input.phone, 60),
    company: normalizeString(input.company, 160),
    type: normalizeString(input.type, 160),
    message: normalizeString(input.message, 1000),
    source: normalizeString(input.source || 'website', 120),
    page: normalizeString(input.page, 160),
    url: normalizeString(input.url, 500),
    userAgent: normalizeString(input.userAgent, 500),
    submittedAt: normalizeString(input.submittedAt, 80)
  };

  if (!lead.name || !lead.phone) {
    throw new Error('name and phone are required');
  }

  return lead;
}

async function readJsonBody(req) {
  let bytes = 0;
  const chunks = [];

  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBodyBytes) {
      throw new Error('request body too large');
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    throw new Error('request body is required');
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function persistLead({ leadsFile, lead }) {
  const receivedAt = new Date().toISOString();
  const id = `lead_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const row = {
    id,
    status: 'new',
    receivedAt,
    lead
  };

  fs.mkdirSync(path.dirname(leadsFile), { recursive: true });
  fs.appendFileSync(leadsFile, `${JSON.stringify(row)}\n`, { encoding: 'utf8' });
  return row;
}

export function createLeadCaptureServer({ leadsFile = defaultLeadsFile } = {}) {
  return http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');

    if (req.method === 'GET' && requestUrl.pathname === '/healthz') {
      jsonResponse(res, 200, {
        status: 'ok',
        service: 'xinghexunjing-leads'
      });
      return;
    }

    if (requestUrl.pathname !== '/leads') {
      jsonResponse(res, 404, { ok: false, error: 'NOT_FOUND' });
      return;
    }

    if (req.method !== 'POST') {
      methodNotAllowed(res);
      return;
    }

    try {
      const payload = await readJsonBody(req);
      const lead = normalizeLeadPayload(payload);
      const row = persistLead({ leadsFile, lead });
      jsonResponse(res, 201, { ok: true, id: row.id });
    } catch (error) {
      jsonResponse(res, 400, {
        ok: false,
        error: 'INVALID_LEAD',
        message: error.message
      });
    }
  });
}

async function runCli() {
  const port = Number(process.env.PORT || 3000);
  const leadsFile = process.env.XINGHE_LEADS_FILE || defaultLeadsFile;
  const server = createLeadCaptureServer({ leadsFile });

  server.listen(port, '0.0.0.0', () => {
    console.log(JSON.stringify({
      ok: true,
      service: 'xinghexunjing-leads',
      port,
      leadsFile
    }));
  });
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
