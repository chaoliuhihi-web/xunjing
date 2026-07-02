import request from '@/config/axios'

const baseUrl = '/xunjing/console'

export interface ConsolePageReqVO extends PageParam {
  projectId?: number
  schoolId?: number
  packageId?: number
  evalSetId?: number
  qrCodeId?: number
  keyword?: string
  resourceType?: string
  mediaType?: string
  sourceType?: string
  scopeType?: string
  status?: string
  reviewStatus?: string
  vectorStatus?: string
  copyrightStatus?: string
  sceneCode?: string
  userTraceId?: string
  safetyStatus?: string
}

export interface ResourcePackageRespVO {
  id: number
  projectId?: number
  schoolId?: number
  packageCode: string
  title: string
  resourceType: string
  versionNo: string
  aiKnowledgeId?: number
  status: string
}

export interface ResourcePackageUpdateReqVO {
  id: number
  title?: string
  versionNo?: string
  aiKnowledgeId?: number
  status?: string
}

export interface KnowledgeDocumentRespVO {
  id: number
  title: string
  sourceType: string
  sourceUrl?: string
  contentDigest?: string
  authorityLevel: string
  reviewStatus: string
  vectorStatus: string
}

export interface KnowledgeDocumentCreateReqVO {
  packageId: number
  title: string
  sourceType: string
  sourceUrl?: string
  contentDigest?: string
  authorityLevel?: string
  reviewStatus?: string
  vectorStatus?: string
}

export interface KnowledgeDocumentReviewReqVO {
  id: number
  authorityLevel?: string
  reviewStatus?: string
  vectorStatus?: string
}

export interface MediaAssetRespVO {
  id: number
  title: string
  mediaType: string
  fileUrl?: string
  objectKey?: string
  sourceProvider?: string
  sourceUrl?: string
  copyrightStatus: string
  reviewStatus: string
  imageTags?: string
  canPublic?: boolean
  canAiUse?: boolean
  canPromotionUse?: boolean
}

export interface MediaAssetCreateReqVO {
  packageId: number
  title: string
  mediaType: string
  fileUrl?: string
  objectKey?: string
  sourceProvider?: string
  sourceUrl?: string
  copyrightStatus?: string
  reviewStatus?: string
  imageTags?: string
  canPublic?: boolean
  canAiUse?: boolean
  canPromotionUse?: boolean
}

export interface MediaAssetReviewReqVO {
  id: number
  copyrightStatus?: string
  reviewStatus?: string
  canPublic?: boolean
  canAiUse?: boolean
  canPromotionUse?: boolean
}

export interface MapPointRespVO {
  id: number
  title: string
  latitude?: number
  longitude?: number
  summary?: string
  sortOrder?: number
  status: string
}

export interface GlobeModelRespVO {
  id: number
  title: string
  modelUrl?: string
  coverUrl?: string
  dataVersion?: string
  status: string
}

export interface QrCodeRespVO {
  id: number
  packageId?: number
  name: string
  sceneCode: string
  path?: string
  targetType?: string
  targetId?: number
  scanCount?: number
  status: string
}

export interface QrCodeStatusUpdateReqVO {
  id: number
  status: string
}

export interface ImportItemRespVO {
  id: number
  sourceId?: number
  projectId?: number
  packageId?: number
  itemType: string
  itemTitle: string
  originalUrl?: string
  fileUrl?: string
  sourceProvider?: string
  evidenceText?: string
  targetType?: string
  targetId?: number
  reviewStatus: string
  status: string
}

export interface BatchReviewImportItemReqVO {
  ids: number[]
  reviewStatus: string
  authorityLevel?: string
  vectorStatus?: string
  rejectReason?: string
}

export interface CrawlerSourceRespVO {
  id: number
  projectId?: number
  packageId?: number
  sourceUrl: string
  host?: string
  sourceKind?: string
  connector?: string
  sourceLane?: string
  captureProfile?: string
  factSourcePolicy?: string
  captureAssets?: boolean
  metadataOnly?: boolean
  status: string
  blockedReasonHint?: string
  notes?: string
}

export interface CrawlerRunItemReqVO {
  itemType?: string
  itemTitle?: string
  originalUrl?: string
  fileUrl?: string
  sourceProvider?: string
  evidenceText?: string
  targetType?: string
}

export interface CrawlerRunReqVO {
  sourceId: number
  items?: CrawlerRunItemReqVO[]
}

export interface CrawlerRunRespVO {
  sourceId: number
  status: string
  createdCount: number
  knowledgeItemCount: number
  mediaItemCount: number
  importItemIds: number[]
}

export interface MediaUsageRespVO {
  id: number
  mediaId?: number
  packageId?: number
  sceneCode?: string
  usageType?: string
  caller?: string
  payloadJson?: string
}

export interface AiEvalSetRespVO {
  id: number
  projectId?: number
  name: string
  sceneCode?: string
  status: string
}

export interface AiEvalCaseRespVO {
  id: number
  evalSetId?: number
  question: string
  expectedPolicy?: string
  riskTags?: string
  sourceRequired?: boolean
  status: string
}

export interface AiEvalRunReqVO {
  evalSetId: number
  packageCode: string
  qrSceneCode?: string
  userTraceId?: string
}

export interface AiEvalRunCaseRespVO {
  caseId: number
  question: string
  passed: boolean
  safetyStatus: string
  sourceCount: number
  logId?: number
  answer?: string
  failureReason?: string
}

export interface AiEvalRunRespVO {
  evalSetId: number
  projectId: number
  sceneCode: string
  totalCount: number
  passedCount: number
  failedCount: number
  passed: boolean
  results: AiEvalRunCaseRespVO[]
}

export interface AiQuotaRuleRespVO {
  id: number
  projectId?: number
  scopeType?: string
  scopeId?: number
  sceneCode?: string
  dailyLimit?: number
  monthlyBudget?: number
  cacheEnabled?: boolean
  fallbackModelCode?: string
  status: string
}

export interface AiGenerationLogRespVO {
  id: number
  projectId?: number
  schoolId?: number
  packageId?: number
  qrCodeId?: number
  sceneCode?: string
  userTraceId?: string
  modelCode?: string
  promptVersion?: string
  inputSummary?: string
  outputSummary?: string
  sourceJson?: string
  tokenCount?: number
  costAmount?: number
  safetyStatus?: string
  cacheHit?: boolean
}

export interface ReadinessRespVO {
  packageCount: number
  reviewedKnowledgeCount: number
  reviewedMediaCount: number
  mapPointCount: number
  globeModelCount: number
  qrCodeCount: number
  interactionCount: number
  mediaUsageCount: number
  aiEvalCaseCount: number
  quotaRuleCount: number
  aiGenerationCount: number
  pendingImportItemCount: number
  p0Ready: boolean
}

export interface DashboardSummaryRespVO {
  projectId: number
  packageCount: number
  reviewedKnowledgeCount: number
  reviewedMediaCount: number
  mapPointCount: number
  globeModelCount: number
  qrCodeCount: number
  totalScanCount: number
  totalAskCount: number
  mediaUsageCount: number
  aiGenerationCount: number
  pendingImportItemCount: number
  p0Ready: boolean
  latestReportId?: number
  latestReportTitle?: string
  latestReportPeriod?: string
}

export interface PublicReportGenerateReqVO {
  projectId: number
  schoolId?: number
  reportPeriod: string
  title: string
}

export const getResourcePackagePage = (params: ConsolePageReqVO) => {
  return request.get<{ list: ResourcePackageRespVO[]; total: number }>({
    url: `${baseUrl}/resource-packages/page`,
    params
  })
}

export const updateResourcePackage = (data: ResourcePackageUpdateReqVO) => {
  return request.put<boolean>({ url: `${baseUrl}/resource-packages`, data })
}

export const createKnowledgeDocument = (data: KnowledgeDocumentCreateReqVO) => {
  return request.post<number>({ url: `${baseUrl}/knowledge-documents`, data })
}

export const uploadKnowledgeDocument = (data: FormData) => {
  return request.post<number>({ url: `${baseUrl}/knowledge-documents/upload`, data })
}

export const getKnowledgeDocumentPage = (params: ConsolePageReqVO) => {
  return request.get<{ list: KnowledgeDocumentRespVO[]; total: number }>({
    url: `${baseUrl}/knowledge-documents/page`,
    params
  })
}

export const reviewKnowledgeDocument = (data: KnowledgeDocumentReviewReqVO) => {
  return request.post<boolean>({ url: `${baseUrl}/knowledge-documents/review`, data })
}

export const getMediaAssetPage = (params: ConsolePageReqVO) => {
  return request.get<{ list: MediaAssetRespVO[]; total: number }>({
    url: `${baseUrl}/media-assets/page`,
    params
  })
}

export const createMediaAsset = (data: MediaAssetCreateReqVO) => {
  return request.post<number>({ url: `${baseUrl}/media-assets`, data })
}

export const uploadMediaAsset = (data: FormData) => {
  return request.post<number>({ url: `${baseUrl}/media-assets/upload`, data })
}

export const reviewMediaAsset = (data: MediaAssetReviewReqVO) => {
  return request.post<boolean>({ url: `${baseUrl}/media-assets/review`, data })
}

export const getMapPointPage = (params: ConsolePageReqVO) => {
  return request.get<{ list: MapPointRespVO[]; total: number }>({
    url: `${baseUrl}/map-points/page`,
    params
  })
}

export const getGlobeModelPage = (params: ConsolePageReqVO) => {
  return request.get<{ list: GlobeModelRespVO[]; total: number }>({
    url: `${baseUrl}/globe-models/page`,
    params
  })
}

export const getQrCodePage = (params: ConsolePageReqVO) => {
  return request.get<{ list: QrCodeRespVO[]; total: number }>({
    url: `${baseUrl}/qrcodes/page`,
    params
  })
}

export const updateQrCodeStatus = (data: QrCodeStatusUpdateReqVO) => {
  return request.put<boolean>({ url: `${baseUrl}/qrcodes/status`, data })
}

export const getImportItemPage = (params: ConsolePageReqVO) => {
  return request.get<{ list: ImportItemRespVO[]; total: number }>({
    url: `${baseUrl}/import-items/page`,
    params
  })
}

export const batchReviewImportItems = (data: BatchReviewImportItemReqVO) => {
  return request.post<number[]>({ url: `${baseUrl}/import-items/batch-review`, data })
}

export const getCrawlerSourcePage = (params: ConsolePageReqVO) => {
  return request.get<{ list: CrawlerSourceRespVO[]; total: number }>({
    url: `${baseUrl}/crawler-sources/page`,
    params
  })
}

export const runCrawlerSourceImport = (data: CrawlerRunReqVO) => {
  return request.post<CrawlerRunRespVO>({ url: `${baseUrl}/crawler-sources/run`, data })
}

export const getMediaUsagePage = (params: ConsolePageReqVO) => {
  return request.get<{ list: MediaUsageRespVO[]; total: number }>({
    url: `${baseUrl}/media-usages/page`,
    params
  })
}

export const getAiEvalSetPage = (params: ConsolePageReqVO) => {
  return request.get<{ list: AiEvalSetRespVO[]; total: number }>({
    url: `${baseUrl}/ai-eval-sets/page`,
    params
  })
}

export const getAiEvalCasePage = (params: ConsolePageReqVO) => {
  return request.get<{ list: AiEvalCaseRespVO[]; total: number }>({
    url: `${baseUrl}/ai-eval-cases/page`,
    params
  })
}

export const runAiEvalSet = (data: AiEvalRunReqVO) => {
  return request.post<AiEvalRunRespVO>({ url: `${baseUrl}/ai-eval-sets/run`, data })
}

export const getAiQuotaRulePage = (params: ConsolePageReqVO) => {
  return request.get<{ list: AiQuotaRuleRespVO[]; total: number }>({
    url: `${baseUrl}/ai-quota-rules/page`,
    params
  })
}

export const getAiGenerationLogPage = (params: ConsolePageReqVO) => {
  return request.get<{ list: AiGenerationLogRespVO[]; total: number }>({
    url: `${baseUrl}/ai-generation-logs/page`,
    params
  })
}

export const getReadiness = (projectId: number) => {
  return request.get<ReadinessRespVO>({ url: `${baseUrl}/readiness`, params: { projectId } })
}

export const getDashboard = (projectId: number) => {
  return request.get<DashboardSummaryRespVO>({ url: `${baseUrl}/dashboard`, params: { projectId } })
}

export const generatePublicReport = (data: PublicReportGenerateReqVO) => {
  return request.post<number>({ url: `${baseUrl}/public-reports`, data })
}
