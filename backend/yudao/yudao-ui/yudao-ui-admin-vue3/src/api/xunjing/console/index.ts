import request from '@/config/axios'

const baseUrl = '/xunjing/console'

export interface ConsolePageReqVO extends PageParam {
  projectId?: number
  schoolId?: number
  packageId?: number
  keyword?: string
  resourceType?: string
  mediaType?: string
  sourceType?: string
  status?: string
  reviewStatus?: string
  vectorStatus?: string
  copyrightStatus?: string
  sceneCode?: string
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
}

export interface MediaAssetReviewReqVO {
  id: number
  copyrightStatus?: string
  reviewStatus?: string
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

export const reviewMediaAsset = (data: MediaAssetReviewReqVO) => {
  return request.post<boolean>({ url: `${baseUrl}/media-assets/review`, data })
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

export const getReadiness = (projectId: number) => {
  return request.get<ReadinessRespVO>({ url: `${baseUrl}/readiness`, params: { projectId } })
}

export const getDashboard = (projectId: number) => {
  return request.get<DashboardSummaryRespVO>({ url: `${baseUrl}/dashboard`, params: { projectId } })
}

export const generatePublicReport = (data: PublicReportGenerateReqVO) => {
  return request.post<number>({ url: `${baseUrl}/public-reports`, data })
}
