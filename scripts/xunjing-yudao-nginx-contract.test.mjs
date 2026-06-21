import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

describe('xunjing Yudao APP API nginx contract', () => {
  test('HTTPS nginx template proxies app-api to the deployed Yudao server', () => {
    const nginx = read('ops/nginx.https.conf.template')

    expect(nginx).toContain('set $xunjing_yudao_app_api_upstream {{YUDAO_APP_API_UPSTREAM}};')
    expect(nginx).toContain('location ^~ /app-api/')
    expect(nginx).toContain('proxy_pass $xunjing_yudao_app_api_upstream;')
    expect(nginx).toContain('proxy_set_header tenant-id $http_tenant_id;')
    expect(nginx).toContain('proxy_set_header X-Forwarded-Proto $scheme;')
    expect(nginx).not.toContain('proxy_pass http://127.0.0.1:48080;')
  })

  test('compose nginx config proxies app-api to the Yudao server service', () => {
    const nginx = read('ops/nginx.compose.conf')

    expect(nginx).toContain('resolver 127.0.0.11')
    expect(nginx).toContain('set $xunjing_yudao_app_api_upstream http://xinghexunjing-yudao:48080;')
    expect(nginx).toContain('location ^~ /app-api/')
    expect(nginx).toContain('proxy_pass $xunjing_yudao_app_api_upstream;')
    expect(nginx).toContain('proxy_set_header tenant-id $http_tenant_id;')
  })

  test('production compose exposes a configurable Yudao upstream for nginx', () => {
    const compose = read('ops/compose.prod.yml')

    expect(compose).toContain('profiles: ["yudao"]')
    expect(compose).toContain('xinghexunjing-yudao')
  })
})
