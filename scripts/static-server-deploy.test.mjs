import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const deployScriptPath = path.join(root, 'ops', 'deploy-static-release.sh');
const httpsTemplatePath = path.join(root, 'ops', 'nginx.https.conf.template');

describe('static server deployment assets', () => {
  test('provides a versioned release script with validation before nginx reload', () => {
    expect(fs.existsSync(deployScriptPath)).toBe(true);

    const script = fs.readFileSync(deployScriptPath, 'utf8');

    expect(script).toContain('releases');
    expect(script).toContain('current');
    expect(script).toContain('runtime-config.js');
    expect(script).toContain('XINGHE_LEAD_WEBHOOK_URL');
    expect(script).toContain('"$nginx_bin" -t');
    expect(script).toContain('"$nginx_bin" -s reload');
    expect(script.indexOf('"$nginx_bin" -t')).toBeLessThan(script.indexOf('"$nginx_bin" -s reload'));
  });

  test('provides an HTTPS nginx template with SPA fallback, ACME, HSTS, and security headers', () => {
    expect(fs.existsSync(httpsTemplatePath)).toBe(true);

    const template = fs.readFileSync(httpsTemplatePath, 'utf8');

    expect(template).toContain('server_name {{DOMAIN}};');
    expect(template).toContain('return 301 https://$host$request_uri;');
    expect(template).toContain('ssl_certificate {{SSL_CERTIFICATE}};');
    expect(template).toContain('root {{SITE_ROOT}}/current;');
    expect(template).toContain('try_files $uri $uri/ /index.html;');
    expect(template).toContain('location ^~ /.well-known/acme-challenge/');
    expect(template).toContain('Strict-Transport-Security');
    expect(template).toContain('Content-Security-Policy');
    expect(template).toContain('Cache-Control "no-store"');
    expect(template).toContain('Cache-Control "public, max-age=2592000, immutable" always;');
  });
});
