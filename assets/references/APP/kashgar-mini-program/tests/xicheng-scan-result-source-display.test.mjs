import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const sourcesCardPath = path.join(root, 'components', 'xicheng', 'XichengScanResultSourcesCard.vue')
const summaryHeroPath = path.join(root, 'components', 'xicheng', 'XichengScanResultSummaryHero.vue')
const sourceHelper = fs.readFileSync(path.join(root, 'request', 'xunjing', 'sources.js'), 'utf8')

assert.ok(
  fs.existsSync(sourcesCardPath),
  'Recognition result reviewed-source list should live in XichengScanResultSourcesCard instead of growing scan-result.vue'
)

const sourcesCard = fs.readFileSync(sourcesCardPath, 'utf8')
const summaryHero = fs.readFileSync(summaryHeroPath, 'utf8')
const sourceTitleHelper = sourcesCard.match(/getDisplaySourceTitle\(source = \{\}\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const sourceDescriptionHelper = sourcesCard.match(/getDisplaySourceDescription\(source = \{\}\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const sourceSummaryLabel = scanResult.match(/sourceSummaryLabel\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const sourceSummaryCopy = scanResult.match(/sourceSummaryCopy\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const questionSectionTitle = scanResult.match(/questionSectionTitle\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const resultCompanionTitle = scanResult.match(/resultCompanionTitle\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''

assert.match(
  scanResult,
  /import XichengScanResultSourcesCard from '@\/components\/xicheng\/XichengScanResultSourcesCard\.vue'[\s\S]*components:[\s\S]*XichengScanResultSourcesCard/,
  'Recognition result page should import and register the split reviewed-source card'
)

assert.match(
  scanResult,
  /<xicheng-scan-result-sources-card[\s\S]*:source-list="sourceList"[\s\S]*:source-empty-copy="sourceEmptyCopy"/,
  'Recognition result page should pass normalized reviewed sources and empty copy into the source card component'
)

assert.match(
  sourcesCard,
  /<text class="source-title">\{\{ getDisplaySourceTitle\(source\) \|\| '审核来源' \}\}<\/text>/,
  'Recognition result source cards should render display-safe source titles'
)

assert.match(
  summaryHero,
  /<view class="result-source-summary"[\s\S]*<text class="result-source-summary-label">\{\{ sourceSummaryLabel \}\}<\/text>[\s\S]*<text class="result-source-summary-copy">\{\{ sourceSummaryCopy \}\}<\/text>[\s\S]*<\/view>/,
  'Recognition result summary card should surface reviewed-source status before lower detail sections'
)

assert.match(
  summaryHero,
  /:class="\{ 'result-source-summary-blocked': recognitionActionBlocked \}"/,
  'Recognition result source summary should visually distinguish blocked or untrusted result states'
)

assert.match(
  sourceSummaryLabel,
  /this\.sourceList\.length > 0[\s\S]*`已审核来源 \$\{this\.sourceList\.length\} 条`[\s\S]*BLOCKED[\s\S]*'无已审核来源'/,
  'Recognition result source summary label should count reviewed sources and name blocked no-source states clearly'
)

assert.match(
  sourceSummaryCopy,
  /this\.sourceList\.length > 0[\s\S]*小京回答将优先引用这些官方来源[\s\S]*this\.sourceEmptyCopy/,
  'Recognition result source summary copy should explain source-backed answers and reuse blocked empty-source copy'
)

assert.match(
  summaryHero,
  /<text class="result-companion-title">\{\{ resultCompanionTitle \}\}<\/text>/,
  'Recognition result companion title should be dynamic instead of claiming every result is matched'
)

assert.match(
  resultCompanionTitle,
  /if \(this\.unsafeRecognitionSafetyStatus\) return '小京暂不能讲解这里'[\s\S]*if \(this\.pendingCandidateConfirmation \|\| this\.missingOfficialPoiContext\) return '小京识别到待确认线索'[\s\S]*return '小京已为你匹配到这里'/,
  'Recognition result companion title should not claim a matched place for blocked or untrusted route contexts'
)

assert.ok(
  questionSectionTitle.indexOf('if (this.unsafeRecognitionSafetyStatus) return this.sourceEmptyCopy') >= 0 &&
    questionSectionTitle.indexOf('if (this.unsafeRecognitionSafetyStatus) return this.sourceEmptyCopy') <
      questionSectionTitle.indexOf('if (this.missingOfficialPoiContext) return'),
  'Recognition result question title should prioritize BLOCKED source refusal before missing-POI guidance'
)

assert.match(
  sourcesCard,
  /<text v-if="getDisplaySourceDescription\(source\)" class="source-desc">\s*\{\{ getDisplaySourceDescription\(source\) \}\}\s*<\/text>/,
  'Recognition result source cards should render curated source descriptions instead of raw backend fields'
)

assert.match(
  sourceTitleHelper,
  /return getXichengDisplaySourceTitle\(source\)/,
  'Recognition result source title helper should delegate cleanup to the shared source display helper'
)

assert.match(
  sourceHelper,
  /source\.title \|\| source\.name \|\| source\.sourceTitle/,
  'Recognition result shared source title helper should read known backend source title fields'
)

assert.match(
  sourceHelper,
  /replace\(\s*\/\\s\*POI\\s\*级已审核来源\\s\*\$\/g/,
  'Recognition result source title helper should strip raw POI reviewed-source suffixes'
)

assert.match(
  sourceDescriptionHelper,
  /return getXichengDisplaySourceDescription\(source\)/,
  'Recognition result source description helper should delegate cleanup to the shared source display helper'
)

assert.match(
  sourceHelper,
  /source\.excerpt \|\| source\.summary \|\| source\.contentDigest/,
  'Recognition result shared source description helper should read known backend source excerpt fields'
)

assert.match(
  sourceHelper,
  /replace\(\s*\/POI 级已审核来源：\[\^。\]\*。\/g/,
  'Recognition result source description helper should strip internal POI seed prefixes'
)

assert.match(
  sourceHelper,
  /replace\(\s*\/生产发布前仍需完成\[\^。\]\*。\/g/,
  'Recognition result source description helper should strip production-review operation notes'
)

assert.match(
  sourceHelper,
  /maxLength = 72[\s\S]*cleanedDescription\.length > boundedLength[\s\S]*cleanedDescription\.slice\(0, boundedLength\)/,
  'Recognition result source description helper should keep source cards compact on mobile'
)

assert.doesNotMatch(
  sourcesCard,
  /\{\{\s*source\.excerpt \|\| source\.summary \|\| source\.url\s*\}\}/,
  'Recognition result source cards should not expose raw source excerpt, summary, or URL fields directly'
)
