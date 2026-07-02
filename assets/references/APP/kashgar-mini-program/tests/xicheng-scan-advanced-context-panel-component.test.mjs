import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scan = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan', 'scan.vue'), 'utf8')
const componentPath = path.join(root, 'components', 'xicheng', 'XichengScanAdvancedContextPanel.vue')

assert.ok(
  fs.existsSync(componentPath),
  'Scan Scene Engine, Agent preview, memory session, world-interface, capabilities, and scene-domain UI should live in XichengScanAdvancedContextPanel instead of growing scan.vue'
)

const component = fs.readFileSync(componentPath, 'utf8')
const scanTemplate = scan.split('<script>')[0]

assert.match(
  scan,
  /import XichengScanAdvancedContextPanel from '@\/components\/xicheng\/XichengScanAdvancedContextPanel\.vue'[\s\S]*XichengScanAdvancedContextPanel/,
  'scan.vue should import and register XichengScanAdvancedContextPanel'
)

assert.match(
  scan,
  /onLoad\(options = \{\}\)[\s\S]*this\.showAdvancedScanContext = this\.shouldShowAdvancedScanContext\(options\)/,
  'scan.vue should keep the advanced panel hidden by default while allowing an explicit route-driven QA/debug reveal'
)

assert.match(
  scan,
  /shouldShowAdvancedScanContext\(options = \{\}\)[\s\S]*showAdvancedScanContext[\s\S]*debugSceneContext[\s\S]*\['1', 'true', 'yes'\]\.includes/,
  'Advanced scan panel reveal should require an explicit truthy route parameter'
)

assert.match(
  scanTemplate,
  /<xicheng-scan-advanced-context-panel[\s\S]*v-if="showAdvancedScanContext"[\s\S]*:scene-fusion-summary="sceneFusionSummary"[\s\S]*:scene-agent-action-previews="sceneAgentActionPreviews"[\s\S]*:memory-session-continuation="memorySessionContinuation"[\s\S]*:world-interface-signals="worldInterfaceSignals"[\s\S]*:scene-domain-capabilities="sceneDomainCapabilities"/,
  'scan.vue should pass live Scene Engine, Agent, memory, world-interface, and scene-domain state into the panel component'
)

for (const [eventName, handlerName] of [
  ['select-scene-agent-action', 'selectSceneAgentAction'],
  ['handle-memory-session-action', 'handleMemorySessionAction']
]) {
  assert.match(
    scanTemplate,
    new RegExp(`@${eventName}="${handlerName}"`),
    `scan.vue should wire ${eventName} back to ${handlerName}`
  )
}

for (const required of [
  'scan-fusion-panel',
  'scan-agent-preview-panel',
  'scan-memory-session-panel',
  'scan-world-interface-hud',
  'scan-capabilities',
  'scan-scene-domain-panel',
  '场景融合',
  'AI识境预判动作',
  'AI识境连续会话包',
  '世界交互入口',
  '看见什么，就能问什么'
]) {
  assert.ok(component.includes(required), `Advanced scan panel component should render ${required}`)
}

assert.doesNotMatch(
  scanTemplate,
  /class="scan-fusion-panel|class="scan-agent-preview-panel|class="scan-memory-session-panel|class="scan-world-interface-hud|class="scan-capabilities|class="scan-scene-domain-panel/,
  'scan.vue template should not keep the extracted advanced context card markup'
)

assert.match(
  component,
  /emits:\s*\[[\s\S]*'select-scene-agent-action'[\s\S]*'handle-memory-session-action'[\s\S]*\]/,
  'Advanced scan panel should expose explicit events for the parent-owned behavior'
)

assert.doesNotMatch(
  component,
  /\/app-api\/xunjing|tenant-id|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Advanced scan panel should remain presentational and should not introduce API headers or client secrets'
)

const pageLineCount = scan.split('\n').length
const componentLineCount = component.split('\n').length
assert.ok(pageLineCount < 1900, `scan.vue should shrink after extracting the advanced context panel; got ${pageLineCount}`)
assert.ok(componentLineCount < 620, `XichengScanAdvancedContextPanel.vue should stay focused; got ${componentLineCount}`)
