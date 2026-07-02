<template>
  <ContentWrap>
    <el-form class="-mb-15px" :inline="true" label-width="90px">
      <el-form-item label="项目编号">
        <el-input-number v-model="projectId" :min="1" :controls="false" class="!w-180px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="overviewLoading" @click="refreshAll">
          <Icon icon="ep:refresh" class="mr-5px" /> 刷新运营台
        </el-button>
        <el-button
          plain
          type="success"
          @click="openReportDialog"
          v-hasPermi="['xunjing:public-report:create']"
        >
          <Icon icon="ep:document-add" class="mr-5px" /> 生成公益报告
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-row :gutter="16">
      <el-col :xs="12" :sm="8" :md="4" v-for="metric in overviewMetrics" :key="metric.label">
        <el-statistic :title="metric.label" :value="metric.value" />
      </el-col>
    </el-row>
    <el-alert
      class="mt-16px"
      :title="dashboard?.p0Ready ? '一期 P0 已满足上线基线' : '一期 P0 仍有后台缺口'"
      :type="dashboard?.p0Ready ? 'success' : 'warning'"
      :closable="false"
      show-icon
    />
    <el-descriptions class="mt-16px" :column="3" border>
      <el-descriptions-item label="资源包">{{ readiness?.packageCount || 0 }}</el-descriptions-item>
      <el-descriptions-item label="已审知识">
        {{ readiness?.reviewedKnowledgeCount || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="已审素材">
        {{ readiness?.reviewedMediaCount || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="地图点位">{{
        readiness?.mapPointCount || 0
      }}</el-descriptions-item>
      <el-descriptions-item label="地球仪模型">
        {{ readiness?.globeModelCount || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="二维码">{{ readiness?.qrCodeCount || 0 }}</el-descriptions-item>
      <el-descriptions-item label="AI 评测题">
        {{ readiness?.aiEvalCaseCount || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="配额规则">
        {{ readiness?.quotaRuleCount || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="待审资料">
        {{ readiness?.pendingImportItemCount || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="最新公益报告">
        <span v-if="dashboard?.latestReportId">
          #{{ dashboard.latestReportId }} {{ dashboard.latestReportTitle }}
        </span>
        <span v-else>暂无</span>
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>

  <ContentWrap>
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="资源包" name="packages">
        <el-form
          class="-mb-15px"
          :model="resourcePackageQuery"
          ref="resourcePackageQueryFormRef"
          :inline="true"
          label-width="82px"
        >
          <el-form-item label="关键词" prop="keyword">
            <el-input
              v-model="resourcePackageQuery.keyword"
              placeholder="标题或编码"
              clearable
              class="!w-220px"
              @keyup.enter="handleResourcePackageQuery"
            />
          </el-form-item>
          <el-form-item label="类型" prop="resourceType">
            <el-select
              v-model="resourcePackageQuery.resourceType"
              placeholder="资源类型"
              clearable
              class="!w-160px"
            >
              <el-option
                v-for="item in resourceTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="resourcePackageQuery.status"
              placeholder="状态"
              clearable
              class="!w-160px"
            >
              <el-option
                v-for="item in packageStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleResourcePackageQuery">
              <Icon icon="ep:search" class="mr-5px" /> 搜索
            </el-button>
            <el-button @click="resetResourcePackageQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 重置
            </el-button>
          </el-form-item>
        </el-form>

        <el-table
          class="mt-20px"
          v-loading="resourcePackageLoading"
          :data="resourcePackageList"
          :stripe="true"
          :show-overflow-tooltip="true"
        >
          <el-table-column label="编号" align="center" prop="id" width="90" />
          <el-table-column label="资源包编码" align="center" prop="packageCode" min-width="170" />
          <el-table-column label="标题" align="center" prop="title" min-width="180" />
          <el-table-column label="类型" align="center" prop="resourceType" width="110">
            <template #default="{ row }">{{
              getOptionLabel(resourceTypeOptions, row.resourceType)
            }}</template>
          </el-table-column>
          <el-table-column label="版本" align="center" prop="versionNo" width="110" />
          <el-table-column label="Yudao 知识库" align="center" prop="aiKnowledgeId" width="140" />
          <el-table-column label="状态" align="center" prop="status" width="120">
            <template #default="{ row }">
              <el-tag :type="getPackageStatusTag(row.status)">
                {{ getOptionLabel(packageStatusOptions, row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="120">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="openResourcePackageDialog(row)"
                v-hasPermi="['xunjing:resource-package:update']"
              >
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="resourcePackageTotal"
          v-model:page="resourcePackageQuery.pageNo"
          v-model:limit="resourcePackageQuery.pageSize"
          @pagination="getResourcePackages"
        />
      </el-tab-pane>

      <el-tab-pane label="知识文档" name="knowledge">
        <el-form
          class="-mb-15px"
          :model="knowledgeQuery"
          ref="knowledgeQueryFormRef"
          :inline="true"
          label-width="82px"
        >
          <el-form-item label="资源包" prop="packageId">
            <el-input-number
              v-model="knowledgeQuery.packageId"
              :min="1"
              :controls="false"
              class="!w-160px"
            />
          </el-form-item>
          <el-form-item label="关键词" prop="keyword">
            <el-input
              v-model="knowledgeQuery.keyword"
              placeholder="标题或摘要"
              clearable
              class="!w-220px"
              @keyup.enter="handleKnowledgeQuery"
            />
          </el-form-item>
          <el-form-item label="审核" prop="reviewStatus">
            <el-select
              v-model="knowledgeQuery.reviewStatus"
              placeholder="审核状态"
              clearable
              class="!w-160px"
            >
              <el-option
                v-for="item in reviewStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="向量" prop="vectorStatus">
            <el-select
              v-model="knowledgeQuery.vectorStatus"
              placeholder="向量状态"
              clearable
              class="!w-160px"
            >
              <el-option
                v-for="item in vectorStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleKnowledgeQuery">
              <Icon icon="ep:search" class="mr-5px" /> 搜索
            </el-button>
            <el-button @click="resetKnowledgeQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 重置
            </el-button>
            <el-button
              type="primary"
              @click="openKnowledgeCreateDialog"
              v-hasPermi="['xunjing:knowledge:create']"
            >
              <Icon icon="ep:plus" class="mr-5px" /> 新增文旅资料
            </el-button>
          </el-form-item>
        </el-form>

        <el-table
          class="mt-20px"
          v-loading="knowledgeLoading"
          :data="knowledgeList"
          :stripe="true"
          :show-overflow-tooltip="true"
        >
          <el-table-column label="编号" align="center" prop="id" width="90" />
          <el-table-column label="标题" align="center" prop="title" min-width="180" />
          <el-table-column label="来源" align="center" prop="sourceType" width="110">
            <template #default="{ row }">{{
              getOptionLabel(sourceTypeOptions, row.sourceType)
            }}</template>
          </el-table-column>
          <el-table-column label="权威等级" align="center" prop="authorityLevel" width="120">
            <template #default="{ row }">
              {{ getOptionLabel(authorityLevelOptions, row.authorityLevel) }}
            </template>
          </el-table-column>
          <el-table-column label="审核" align="center" prop="reviewStatus" width="120">
            <template #default="{ row }">
              <el-tag :type="getReviewStatusTag(row.reviewStatus)">
                {{ getOptionLabel(reviewStatusOptions, row.reviewStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="向量" align="center" prop="vectorStatus" width="120">
            <template #default="{ row }">
              <el-tag :type="getVectorStatusTag(row.vectorStatus)">
                {{ getOptionLabel(vectorStatusOptions, row.vectorStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="来源地址" align="center" prop="sourceUrl" min-width="180" />
          <el-table-column label="操作" align="center" width="150">
            <template #default="{ row }">
              <el-button
                link
                type="success"
                @click="openKnowledgeReviewDialog(row, 'APPROVED')"
                v-hasPermi="['xunjing:knowledge:review']"
              >
                通过
              </el-button>
              <el-button
                link
                type="danger"
                @click="openKnowledgeReviewDialog(row, 'REJECTED')"
                v-hasPermi="['xunjing:knowledge:review']"
              >
                拒绝
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="knowledgeTotal"
          v-model:page="knowledgeQuery.pageNo"
          v-model:limit="knowledgeQuery.pageSize"
          @pagination="getKnowledgeDocuments"
        />
      </el-tab-pane>

      <el-tab-pane label="图影中华素材" name="media">
        <el-form
          class="-mb-15px"
          :model="mediaQuery"
          ref="mediaQueryFormRef"
          :inline="true"
          label-width="82px"
        >
          <el-form-item label="资源包" prop="packageId">
            <el-input-number
              v-model="mediaQuery.packageId"
              :min="1"
              :controls="false"
              class="!w-160px"
            />
          </el-form-item>
          <el-form-item label="关键词" prop="keyword">
            <el-input
              v-model="mediaQuery.keyword"
              placeholder="标题、标签"
              clearable
              class="!w-220px"
              @keyup.enter="handleMediaQuery"
            />
          </el-form-item>
          <el-form-item label="类型" prop="mediaType">
            <el-select
              v-model="mediaQuery.mediaType"
              placeholder="素材类型"
              clearable
              class="!w-160px"
            >
              <el-option
                v-for="item in mediaTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="版权" prop="copyrightStatus">
            <el-select
              v-model="mediaQuery.copyrightStatus"
              placeholder="版权状态"
              clearable
              class="!w-160px"
            >
              <el-option
                v-for="item in copyrightStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleMediaQuery">
              <Icon icon="ep:search" class="mr-5px" /> 搜索
            </el-button>
            <el-button @click="resetMediaQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 重置
            </el-button>
            <el-button
              type="primary"
              @click="openMediaCreateDialog"
              v-hasPermi="['xunjing:media:create']"
            >
              <Icon icon="ep:plus" class="mr-5px" /> 新增图片素材
            </el-button>
          </el-form-item>
        </el-form>

        <el-table
          class="mt-20px"
          v-loading="mediaLoading"
          :data="mediaList"
          :stripe="true"
          :show-overflow-tooltip="true"
        >
          <el-table-column label="编号" align="center" prop="id" width="90" />
          <el-table-column label="预览" align="center" width="100">
            <template #default="{ row }">
              <el-image
                v-if="row.mediaType === 'IMAGE' && row.fileUrl"
                class="h-56px w-72px"
                :src="row.fileUrl"
                :preview-src-list="[row.fileUrl]"
                preview-teleported
                fit="cover"
              />
              <el-link v-else-if="row.fileUrl" :href="row.fileUrl" target="_blank" type="primary">
                查看
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="标题" align="center" prop="title" min-width="180" />
          <el-table-column label="类型" align="center" prop="mediaType" width="110">
            <template #default="{ row }">{{
              getOptionLabel(mediaTypeOptions, row.mediaType)
            }}</template>
          </el-table-column>
          <el-table-column label="来源方" align="center" prop="sourceProvider" min-width="120" />
          <el-table-column label="版权" align="center" prop="copyrightStatus" width="120">
            <template #default="{ row }">
              <el-tag :type="getCopyrightStatusTag(row.copyrightStatus)">
                {{ getOptionLabel(copyrightStatusOptions, row.copyrightStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="审核" align="center" prop="reviewStatus" width="120">
            <template #default="{ row }">
              <el-tag :type="getReviewStatusTag(row.reviewStatus)">
                {{ getOptionLabel(reviewStatusOptions, row.reviewStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="可用场景" align="center" width="210">
            <template #default="{ row }">
              <el-space wrap>
                <el-tag :type="row.canPublic === false ? 'info' : 'success'">
                  {{ row.canPublic === false ? '不公开' : '公开' }}
                </el-tag>
                <el-tag :type="row.canAiUse === false ? 'info' : 'success'">
                  {{ row.canAiUse === false ? 'AI 禁用' : 'AI 可用' }}
                </el-tag>
                <el-tag :type="row.canPromotionUse ? 'success' : 'info'">
                  {{ row.canPromotionUse ? '可宣传' : '不宣传' }}
                </el-tag>
              </el-space>
            </template>
          </el-table-column>
          <el-table-column label="标签" align="center" prop="imageTags" min-width="150" />
          <el-table-column label="操作" align="center" width="150">
            <template #default="{ row }">
              <el-button
                link
                type="success"
                @click="openMediaReviewDialog(row, 'APPROVED')"
                v-hasPermi="['xunjing:media:review']"
              >
                通过
              </el-button>
              <el-button
                link
                type="danger"
                @click="openMediaReviewDialog(row, 'REJECTED')"
                v-hasPermi="['xunjing:media:review']"
              >
                拒绝
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="mediaTotal"
          v-model:page="mediaQuery.pageNo"
          v-model:limit="mediaQuery.pageSize"
          @pagination="getMediaAssets"
        />
      </el-tab-pane>

      <el-tab-pane label="二维码" name="qrcodes">
        <el-form
          class="-mb-15px"
          :model="qrCodeQuery"
          ref="qrCodeQueryFormRef"
          :inline="true"
          label-width="82px"
        >
          <el-form-item label="资源包" prop="packageId">
            <el-input-number
              v-model="qrCodeQuery.packageId"
              :min="1"
              :controls="false"
              class="!w-160px"
            />
          </el-form-item>
          <el-form-item label="关键词" prop="keyword">
            <el-input
              v-model="qrCodeQuery.keyword"
              placeholder="名称"
              clearable
              class="!w-220px"
              @keyup.enter="handleQrCodeQuery"
            />
          </el-form-item>
          <el-form-item label="场景码" prop="sceneCode">
            <el-input
              v-model="qrCodeQuery.sceneCode"
              placeholder="sceneCode"
              clearable
              class="!w-180px"
              @keyup.enter="handleQrCodeQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="qrCodeQuery.status" placeholder="状态" clearable class="!w-160px">
              <el-option
                v-for="item in qrCodeStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQrCodeQuery">
              <Icon icon="ep:search" class="mr-5px" /> 搜索
            </el-button>
            <el-button @click="resetQrCodeQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 重置
            </el-button>
          </el-form-item>
        </el-form>

        <el-table
          class="mt-20px"
          v-loading="qrCodeLoading"
          :data="qrCodeList"
          :stripe="true"
          :show-overflow-tooltip="true"
        >
          <el-table-column label="编号" align="center" prop="id" width="90" />
          <el-table-column label="名称" align="center" prop="name" min-width="160" />
          <el-table-column label="场景码" align="center" prop="sceneCode" min-width="170" />
          <el-table-column label="路径" align="center" prop="path" min-width="180" />
          <el-table-column label="目标" align="center" min-width="150">
            <template #default="{ row }"
              >{{ row.targetType || '-' }} / {{ row.targetId || '-' }}</template
            >
          </el-table-column>
          <el-table-column label="扫码数" align="center" prop="scanCount" width="100" />
          <el-table-column label="状态" align="center" prop="status" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                {{ getOptionLabel(qrCodeStatusOptions, row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="150">
            <template #default="{ row }">
              <el-button
                v-if="row.status !== 'ACTIVE'"
                link
                type="success"
                @click="updateQrCode(row, 'ACTIVE')"
                v-hasPermi="['xunjing:qrcode:update']"
              >
                启用
              </el-button>
              <el-button
                v-else
                link
                type="danger"
                @click="updateQrCode(row, 'DISABLED')"
                v-hasPermi="['xunjing:qrcode:update']"
              >
                停用
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="qrCodeTotal"
          v-model:page="qrCodeQuery.pageNo"
          v-model:limit="qrCodeQuery.pageSize"
          @pagination="getQrCodes"
        />
      </el-tab-pane>

      <el-tab-pane label="资料导入审核" name="imports">
        <el-form
          class="-mb-15px"
          :model="importItemQuery"
          ref="importItemQueryFormRef"
          :inline="true"
          label-width="82px"
        >
          <el-form-item label="资源包" prop="packageId">
            <el-input-number
              v-model="importItemQuery.packageId"
              :min="1"
              :controls="false"
              class="!w-160px"
            />
          </el-form-item>
          <el-form-item label="关键词" prop="keyword">
            <el-input
              v-model="importItemQuery.keyword"
              placeholder="标题、来源"
              clearable
              class="!w-220px"
              @keyup.enter="handleImportItemQuery"
            />
          </el-form-item>
          <el-form-item label="审核" prop="reviewStatus">
            <el-select
              v-model="importItemQuery.reviewStatus"
              placeholder="审核状态"
              clearable
              class="!w-160px"
            >
              <el-option
                v-for="item in reviewStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="importItemQuery.status"
              placeholder="导入状态"
              clearable
              class="!w-170px"
            >
              <el-option
                v-for="item in importStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleImportItemQuery">
              <Icon icon="ep:search" class="mr-5px" /> 搜索
            </el-button>
            <el-button @click="resetImportItemQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 重置
            </el-button>
            <el-button
              type="success"
              plain
              :disabled="checkedImportItemIds.length === 0"
              @click="openImportReviewDialog('APPROVED')"
              v-hasPermi="['xunjing:import-item:review']"
            >
              <Icon icon="ep:check" class="mr-5px" /> 批量通过
            </el-button>
            <el-button
              type="danger"
              plain
              :disabled="checkedImportItemIds.length === 0"
              @click="openImportReviewDialog('REJECTED')"
              v-hasPermi="['xunjing:import-item:review']"
            >
              <Icon icon="ep:close" class="mr-5px" /> 批量拒绝
            </el-button>
          </el-form-item>
        </el-form>

        <el-table
          class="mt-20px"
          v-loading="importItemLoading"
          :data="importItemList"
          :stripe="true"
          :show-overflow-tooltip="true"
          @selection-change="handleImportSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="编号" align="center" prop="id" width="90" />
          <el-table-column label="标题" align="center" prop="itemTitle" min-width="180" />
          <el-table-column label="类型" align="center" prop="itemType" width="100" />
          <el-table-column label="来源方" align="center" prop="sourceProvider" min-width="120" />
          <el-table-column label="原始地址" align="center" prop="originalUrl" min-width="180" />
          <el-table-column label="审核" align="center" prop="reviewStatus" width="120">
            <template #default="{ row }">
              <el-tag :type="getReviewStatusTag(row.reviewStatus)">
                {{ getOptionLabel(reviewStatusOptions, row.reviewStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="导入状态" align="center" prop="status" width="130">
            <template #default="{ row }">
              {{ getOptionLabel(importStatusOptions, row.status) }}
            </template>
          </el-table-column>
          <el-table-column label="目标" align="center" min-width="150">
            <template #default="{ row }"
              >{{ row.targetType || '-' }} / {{ row.targetId || '-' }}</template
            >
          </el-table-column>
          <el-table-column label="操作" align="center" width="150">
            <template #default="{ row }">
              <el-button
                link
                type="success"
                @click="openImportReviewDialog('APPROVED', row)"
                v-hasPermi="['xunjing:import-item:review']"
              >
                通过
              </el-button>
              <el-button
                link
                type="danger"
                @click="openImportReviewDialog('REJECTED', row)"
                v-hasPermi="['xunjing:import-item:review']"
              >
                拒绝
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="importItemTotal"
          v-model:page="importItemQuery.pageNo"
          v-model:limit="importItemQuery.pageSize"
          @pagination="getImportItems"
        />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>

  <Dialog v-model="resourcePackageDialogVisible" title="编辑资源包" width="560px">
    <el-form :model="resourcePackageForm" label-width="110px">
      <el-form-item label="资源包编号">
        <el-input v-model="resourcePackageForm.id" disabled />
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="resourcePackageForm.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="版本号">
        <el-input v-model="resourcePackageForm.versionNo" placeholder="如 v1.0.0" />
      </el-form-item>
      <el-form-item label="Yudao 知识库">
        <el-input-number
          v-model="resourcePackageForm.aiKnowledgeId"
          :min="1"
          :controls="false"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="resourcePackageForm.status" class="!w-240px">
          <el-option
            v-for="item in packageStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        :disabled="resourcePackageSubmitLoading"
        @click="resourcePackageDialogVisible = false"
      >
        取 消
      </el-button>
      <el-button
        type="primary"
        :loading="resourcePackageSubmitLoading"
        @click="submitResourcePackage"
      >
        确 定
      </el-button>
    </template>
  </Dialog>

  <Dialog v-model="knowledgeCreateDialogVisible" title="新增文旅资料" width="640px">
    <el-form :model="knowledgeCreateForm" label-width="110px">
      <el-form-item label="文旅集合 ID">
        <el-input-number
          v-model="knowledgeCreateForm.packageId"
          :min="1"
          :controls="false"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="knowledgeCreateForm.title" placeholder="如 恭王府官方简介" />
      </el-form-item>
      <el-form-item label="来源类型">
        <el-select v-model="knowledgeCreateForm.sourceType" class="!w-240px">
          <el-option
            v-for="item in sourceTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="来源地址">
        <el-input v-model="knowledgeCreateForm.sourceUrl" placeholder="官网、资料页或内部文件地址" />
      </el-form-item>
      <el-form-item label="资料文件">
        <el-upload
          :auto-upload="false"
          :limit="1"
          :before-upload="beforeKnowledgeFileUpload"
          :on-change="handleKnowledgeFileChange"
          :on-remove="clearKnowledgeUploadFile"
          accept=".txt,.md,.csv,.json,.html,.pdf,.doc,.docx"
        >
          <el-button>
            <Icon icon="ep:upload" class="mr-5px" /> 上传文旅资料文件
          </el-button>
        </el-upload>
      </el-form-item>
      <el-form-item label="资料摘要">
        <el-input
          v-model="knowledgeCreateForm.contentDigest"
          type="textarea"
          :rows="4"
          placeholder="录入可用于 AI 讲解、问答检索的文旅资料摘要"
        />
      </el-form-item>
      <el-form-item label="权威等级">
        <el-select v-model="knowledgeCreateForm.authorityLevel" class="!w-240px">
          <el-option
            v-for="item in authorityLevelOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="knowledgeCreateForm.reviewStatus" class="!w-240px">
          <el-option
            v-for="item in reviewStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="向量状态">
        <el-select v-model="knowledgeCreateForm.vectorStatus" class="!w-240px">
          <el-option
            v-for="item in vectorStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        :disabled="knowledgeCreateSubmitLoading"
        @click="knowledgeCreateDialogVisible = false"
      >
        取 消
      </el-button>
      <el-button
        type="primary"
        :loading="knowledgeCreateSubmitLoading"
        @click="submitKnowledgeCreate"
      >
        确 定
      </el-button>
      <el-button
        type="success"
        :loading="knowledgeCreateSubmitLoading"
        @click="submitKnowledgeUpload"
      >
        上传入库
      </el-button>
    </template>
  </Dialog>

  <Dialog v-model="mediaCreateDialogVisible" title="新增图片素材" width="640px">
    <el-form :model="mediaCreateForm" label-width="110px">
      <el-form-item label="文旅集合 ID">
        <el-input-number
          v-model="mediaCreateForm.packageId"
          :min="1"
          :controls="false"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="mediaCreateForm.title" placeholder="如 恭王府入口授权图片" />
      </el-form-item>
      <el-form-item label="素材类型">
        <el-select v-model="mediaCreateForm.mediaType" class="!w-240px">
          <el-option
            v-for="item in mediaTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="文件地址">
        <el-input v-model="mediaCreateForm.fileUrl" placeholder="图片 URL 或对象存储访问地址" />
      </el-form-item>
      <el-form-item label="素材文件">
        <el-upload
          :auto-upload="false"
          :limit="1"
          :before-upload="beforeMediaFileUpload"
          :on-change="handleMediaFileChange"
          :on-remove="clearMediaUploadFile"
          accept="image/*"
        >
          <el-button>
            <Icon icon="ep:upload" class="mr-5px" /> 上传图片素材文件
          </el-button>
        </el-upload>
      </el-form-item>
      <el-form-item label="对象 Key">
        <el-input v-model="mediaCreateForm.objectKey" placeholder="对象存储 Key，可选" />
      </el-form-item>
      <el-form-item label="来源方">
        <el-input v-model="mediaCreateForm.sourceProvider" placeholder="如 文旅局、景区、项目方" />
      </el-form-item>
      <el-form-item label="来源地址">
        <el-input v-model="mediaCreateForm.sourceUrl" placeholder="授权来源页或原始素材地址" />
      </el-form-item>
      <el-form-item label="图片标签">
        <el-input
          v-model="mediaCreateForm.imageTags"
          type="textarea"
          :rows="3"
          placeholder="如 入口, 王府, 北京西城"
        />
      </el-form-item>
      <el-form-item label="版权状态">
        <el-select v-model="mediaCreateForm.copyrightStatus" class="!w-240px">
          <el-option
            v-for="item in copyrightStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="mediaCreateForm.reviewStatus" class="!w-240px">
          <el-option
            v-for="item in reviewStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="公开展示">
        <el-switch v-model="mediaCreateForm.canPublic" />
      </el-form-item>
      <el-form-item label="AI 使用">
        <el-switch v-model="mediaCreateForm.canAiUse" />
      </el-form-item>
      <el-form-item label="宣传使用">
        <el-switch v-model="mediaCreateForm.canPromotionUse" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="mediaCreateSubmitLoading" @click="mediaCreateDialogVisible = false">
        取 消
      </el-button>
      <el-button type="primary" :loading="mediaCreateSubmitLoading" @click="submitMediaCreate">
        确 定
      </el-button>
      <el-button type="success" :loading="mediaCreateSubmitLoading" @click="submitMediaUpload">
        上传入库
      </el-button>
    </template>
  </Dialog>

  <Dialog v-model="reviewDialogVisible" :title="reviewDialogTitle" width="560px">
    <el-form :model="reviewForm" label-width="110px">
      <el-form-item label="审核状态">
        <el-select v-model="reviewForm.reviewStatus" class="!w-240px">
          <el-option
            v-for="item in reviewStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="reviewTarget !== 'media'" label="权威等级">
        <el-select v-model="reviewForm.authorityLevel" class="!w-240px">
          <el-option
            v-for="item in authorityLevelOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="reviewTarget !== 'media'" label="向量状态">
        <el-select v-model="reviewForm.vectorStatus" class="!w-240px">
          <el-option
            v-for="item in vectorStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="reviewTarget === 'media'" label="版权状态">
        <el-select v-model="reviewForm.copyrightStatus" class="!w-240px">
          <el-option
            v-for="item in copyrightStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <template v-if="reviewTarget === 'media'">
        <el-form-item label="公开展示">
          <el-switch v-model="reviewForm.canPublic" />
        </el-form-item>
        <el-form-item label="AI 使用">
          <el-switch v-model="reviewForm.canAiUse" />
        </el-form-item>
        <el-form-item label="宣传使用">
          <el-switch v-model="reviewForm.canPromotionUse" />
        </el-form-item>
      </template>
      <el-form-item
        v-if="reviewTarget === 'import' && reviewForm.reviewStatus === 'REJECTED'"
        label="拒绝原因"
      >
        <el-input
          v-model="reviewForm.rejectReason"
          type="textarea"
          :rows="3"
          placeholder="请输入拒绝原因"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="reviewSubmitLoading" @click="reviewDialogVisible = false"
        >取 消</el-button
      >
      <el-button type="primary" :loading="reviewSubmitLoading" @click="submitReview"
        >确 定</el-button
      >
    </template>
  </Dialog>

  <Dialog v-model="reportDialogVisible" title="生成公益报告" width="560px">
    <el-form :model="reportForm" label-width="110px">
      <el-form-item label="项目编号">
        <el-input-number
          v-model="reportForm.projectId"
          :min="1"
          :controls="false"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="学校编号">
        <el-input-number
          v-model="reportForm.schoolId"
          :min="1"
          :controls="false"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报告周期">
        <el-input v-model="reportForm.reportPeriod" placeholder="如 2026-06" />
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="reportForm.title" placeholder="请输入报告标题" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="reportSubmitLoading" @click="reportDialogVisible = false"
        >取 消</el-button
      >
      <el-button type="primary" :loading="reportSubmitLoading" @click="submitPublicReport">
        确 定
      </el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as XunjingConsoleApi from '@/api/xunjing/console'

defineOptions({ name: 'XunjingConsole' })

type OptionItem = {
  label: string
  value: string
}
type ReviewTarget = 'knowledge' | 'media' | 'import'

const message = useMessage()

const projectId = ref(1)
const activeTab = ref('packages')
const overviewLoading = ref(false)
const readiness = ref<XunjingConsoleApi.ReadinessRespVO>()
const dashboard = ref<XunjingConsoleApi.DashboardSummaryRespVO>()

const resourceTypeOptions: OptionItem[] = [
  { label: '图书', value: 'BOOK' },
  { label: '地图', value: 'MAP' },
  { label: '地球仪', value: 'GLOBE' }
]
const packageStatusOptions: OptionItem[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已下线', value: 'OFFLINE' }
]
const sourceTypeOptions: OptionItem[] = [
  { label: '人工录入', value: 'MANUAL' },
  { label: '爬虫采集', value: 'CRAWLER' },
  { label: '资料导入', value: 'IMPORT' }
]
const authorityLevelOptions: OptionItem[] = [
  { label: '官方权威', value: 'OFFICIAL' },
  { label: '已核验', value: 'VERIFIED' },
  { label: '参考资料', value: 'REFERENCE' }
]
const reviewStatusOptions: OptionItem[] = [
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' }
]
const vectorStatusOptions: OptionItem[] = [
  { label: '待索引', value: 'PENDING' },
  { label: '已索引', value: 'INDEXED' },
  { label: '索引失败', value: 'FAILED' }
]
const mediaTypeOptions: OptionItem[] = [
  { label: '图片', value: 'IMAGE' },
  { label: '视频', value: 'VIDEO' },
  { label: '模型', value: 'MODEL' }
]
const copyrightStatusOptions: OptionItem[] = [
  { label: '已授权', value: 'AUTHORIZED' },
  { label: '待确认', value: 'PENDING' },
  { label: '受限', value: 'RESTRICTED' }
]
const qrCodeStatusOptions: OptionItem[] = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' }
]
const importStatusOptions: OptionItem[] = [
  { label: '待审核', value: 'PENDING_REVIEW' },
  { label: '已导入', value: 'IMPORTED' },
  { label: '已拒绝', value: 'REJECTED' }
]

const overviewMetrics = computed(() => [
  { label: '扫码次数', value: dashboard.value?.totalScanCount || 0 },
  { label: '问答次数', value: dashboard.value?.totalAskCount || 0 },
  { label: '素材调用', value: dashboard.value?.mediaUsageCount || 0 },
  { label: 'AI 调用', value: dashboard.value?.aiGenerationCount || 0 },
  { label: '资源包', value: dashboard.value?.packageCount || 0 },
  { label: '待审资料', value: dashboard.value?.pendingImportItemCount || 0 }
])

const resourcePackageLoading = ref(false)
const resourcePackageTotal = ref(0)
const resourcePackageList = ref<XunjingConsoleApi.ResourcePackageRespVO[]>([])
const resourcePackageQueryFormRef = ref()
const resourcePackageQuery = reactive<XunjingConsoleApi.ConsolePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  projectId: 1,
  keyword: undefined,
  resourceType: undefined,
  status: undefined
})

const knowledgeLoading = ref(false)
const knowledgeTotal = ref(0)
const knowledgeList = ref<XunjingConsoleApi.KnowledgeDocumentRespVO[]>([])
const knowledgeQueryFormRef = ref()
const knowledgeQuery = reactive<XunjingConsoleApi.ConsolePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  projectId: 1,
  packageId: undefined,
  keyword: undefined,
  reviewStatus: undefined,
  vectorStatus: undefined
})

const mediaLoading = ref(false)
const mediaTotal = ref(0)
const mediaList = ref<XunjingConsoleApi.MediaAssetRespVO[]>([])
const mediaQueryFormRef = ref()
const mediaQuery = reactive<XunjingConsoleApi.ConsolePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  projectId: 1,
  packageId: undefined,
  keyword: undefined,
  mediaType: undefined,
  copyrightStatus: undefined
})

const qrCodeLoading = ref(false)
const qrCodeTotal = ref(0)
const qrCodeList = ref<XunjingConsoleApi.QrCodeRespVO[]>([])
const qrCodeQueryFormRef = ref()
const qrCodeQuery = reactive<XunjingConsoleApi.ConsolePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  projectId: 1,
  packageId: undefined,
  keyword: undefined,
  sceneCode: undefined,
  status: undefined
})

const importItemLoading = ref(false)
const importItemTotal = ref(0)
const importItemList = ref<XunjingConsoleApi.ImportItemRespVO[]>([])
const importItemQueryFormRef = ref()
const importItemQuery = reactive<XunjingConsoleApi.ConsolePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  projectId: 1,
  packageId: undefined,
  keyword: undefined,
  reviewStatus: undefined,
  status: undefined
})
const checkedImportItemIds = ref<number[]>([])

const resourcePackageDialogVisible = ref(false)
const resourcePackageSubmitLoading = ref(false)
const resourcePackageForm = reactive<XunjingConsoleApi.ResourcePackageUpdateReqVO>({
  id: 0,
  title: undefined,
  versionNo: undefined,
  aiKnowledgeId: undefined,
  status: undefined
})

const knowledgeCreateDialogVisible = ref(false)
const knowledgeCreateSubmitLoading = ref(false)
const knowledgeCreateForm = reactive<XunjingConsoleApi.KnowledgeDocumentCreateReqVO>({
  packageId: 1,
  title: '',
  sourceType: 'MANUAL',
  sourceUrl: '',
  contentDigest: '',
  authorityLevel: 'OFFICIAL',
  reviewStatus: 'PENDING',
  vectorStatus: 'PENDING'
})
const knowledgeUploadFile = ref<File>()

const mediaCreateDialogVisible = ref(false)
const mediaCreateSubmitLoading = ref(false)
const mediaCreateForm = reactive<XunjingConsoleApi.MediaAssetCreateReqVO>({
  packageId: 1,
  title: '',
  mediaType: 'IMAGE',
  fileUrl: '',
  objectKey: '',
  sourceProvider: '',
  sourceUrl: '',
  copyrightStatus: 'PENDING',
  reviewStatus: 'PENDING',
  imageTags: '',
  canPublic: true,
  canAiUse: true,
  canPromotionUse: false
})
const mediaUploadFile = ref<File>()

const reviewDialogVisible = ref(false)
const reviewSubmitLoading = ref(false)
const reviewTarget = ref<ReviewTarget>('knowledge')
const reviewForm = reactive({
  id: 0,
  ids: [] as number[],
  reviewStatus: 'APPROVED',
  authorityLevel: 'OFFICIAL',
  vectorStatus: 'INDEXED',
  copyrightStatus: 'AUTHORIZED',
  canPublic: true,
  canAiUse: true,
  canPromotionUse: false,
  rejectReason: ''
})
const reviewDialogTitle = computed(() => {
  const action = reviewForm.reviewStatus === 'APPROVED' ? '通过' : '拒绝'
  if (reviewTarget.value === 'knowledge') {
    return `${action}知识文档`
  }
  if (reviewTarget.value === 'media') {
    return `${action}图影中华素材`
  }
  return `${action}资料导入审核`
})

const reportDialogVisible = ref(false)
const reportSubmitLoading = ref(false)
const reportForm = reactive<XunjingConsoleApi.PublicReportGenerateReqVO>({
  projectId: 1,
  schoolId: undefined,
  reportPeriod: '',
  title: ''
})

const getOptionLabel = (options: OptionItem[], value?: string) => {
  return options.find((item) => item.value === value)?.label || value || '-'
}

const getPackageStatusTag = (status?: string) => {
  if (status === 'PUBLISHED') {
    return 'success'
  }
  if (status === 'OFFLINE') {
    return 'info'
  }
  return 'warning'
}

const getReviewStatusTag = (status?: string) => {
  if (status === 'APPROVED') {
    return 'success'
  }
  if (status === 'REJECTED') {
    return 'danger'
  }
  return 'warning'
}

const getVectorStatusTag = (status?: string) => {
  if (status === 'INDEXED') {
    return 'success'
  }
  if (status === 'FAILED') {
    return 'danger'
  }
  return 'warning'
}

const getCopyrightStatusTag = (status?: string) => {
  if (status === 'AUTHORIZED') {
    return 'success'
  }
  if (status === 'RESTRICTED') {
    return 'danger'
  }
  return 'warning'
}

const syncProjectScope = () => {
  resourcePackageQuery.projectId = projectId.value
  knowledgeQuery.projectId = projectId.value
  mediaQuery.projectId = projectId.value
  qrCodeQuery.projectId = projectId.value
  importItemQuery.projectId = projectId.value
}

const loadOverview = async () => {
  overviewLoading.value = true
  try {
    const [readinessData, dashboardData] = await Promise.all([
      XunjingConsoleApi.getReadiness(projectId.value),
      XunjingConsoleApi.getDashboard(projectId.value)
    ])
    readiness.value = readinessData
    dashboard.value = dashboardData
  } finally {
    overviewLoading.value = false
  }
}

const getResourcePackages = async () => {
  resourcePackageLoading.value = true
  try {
    const data = await XunjingConsoleApi.getResourcePackagePage(resourcePackageQuery)
    resourcePackageList.value = data.list
    resourcePackageTotal.value = data.total
  } finally {
    resourcePackageLoading.value = false
  }
}

const getKnowledgeDocuments = async () => {
  knowledgeLoading.value = true
  try {
    const data = await XunjingConsoleApi.getKnowledgeDocumentPage(knowledgeQuery)
    knowledgeList.value = data.list
    knowledgeTotal.value = data.total
  } finally {
    knowledgeLoading.value = false
  }
}

const getMediaAssets = async () => {
  mediaLoading.value = true
  try {
    const data = await XunjingConsoleApi.getMediaAssetPage(mediaQuery)
    mediaList.value = data.list
    mediaTotal.value = data.total
  } finally {
    mediaLoading.value = false
  }
}

const getQrCodes = async () => {
  qrCodeLoading.value = true
  try {
    const data = await XunjingConsoleApi.getQrCodePage(qrCodeQuery)
    qrCodeList.value = data.list
    qrCodeTotal.value = data.total
  } finally {
    qrCodeLoading.value = false
  }
}

const getImportItems = async () => {
  importItemLoading.value = true
  try {
    const data = await XunjingConsoleApi.getImportItemPage(importItemQuery)
    importItemList.value = data.list
    importItemTotal.value = data.total
  } finally {
    importItemLoading.value = false
  }
}

const loadActiveTab = () => {
  if (activeTab.value === 'packages') {
    return getResourcePackages()
  }
  if (activeTab.value === 'knowledge') {
    return getKnowledgeDocuments()
  }
  if (activeTab.value === 'media') {
    return getMediaAssets()
  }
  if (activeTab.value === 'qrcodes') {
    return getQrCodes()
  }
  return getImportItems()
}

const refreshAll = async () => {
  syncProjectScope()
  await Promise.all([loadOverview(), loadActiveTab()])
}

const handleTabChange = async () => {
  syncProjectScope()
  await loadActiveTab()
}

const handleResourcePackageQuery = () => {
  resourcePackageQuery.pageNo = 1
  getResourcePackages()
}

const resetResourcePackageQuery = () => {
  resourcePackageQueryFormRef.value?.resetFields()
  Object.assign(resourcePackageQuery, {
    pageNo: 1,
    pageSize: 10,
    projectId: projectId.value,
    keyword: undefined,
    resourceType: undefined,
    status: undefined
  })
  getResourcePackages()
}

const handleKnowledgeQuery = () => {
  knowledgeQuery.pageNo = 1
  getKnowledgeDocuments()
}

const resetKnowledgeQuery = () => {
  knowledgeQueryFormRef.value?.resetFields()
  Object.assign(knowledgeQuery, {
    pageNo: 1,
    pageSize: 10,
    projectId: projectId.value,
    packageId: undefined,
    keyword: undefined,
    reviewStatus: undefined,
    vectorStatus: undefined
  })
  getKnowledgeDocuments()
}

const handleMediaQuery = () => {
  mediaQuery.pageNo = 1
  getMediaAssets()
}

const resetMediaQuery = () => {
  mediaQueryFormRef.value?.resetFields()
  Object.assign(mediaQuery, {
    pageNo: 1,
    pageSize: 10,
    projectId: projectId.value,
    packageId: undefined,
    keyword: undefined,
    mediaType: undefined,
    copyrightStatus: undefined
  })
  getMediaAssets()
}

const handleQrCodeQuery = () => {
  qrCodeQuery.pageNo = 1
  getQrCodes()
}

const resetQrCodeQuery = () => {
  qrCodeQueryFormRef.value?.resetFields()
  Object.assign(qrCodeQuery, {
    pageNo: 1,
    pageSize: 10,
    projectId: projectId.value,
    packageId: undefined,
    keyword: undefined,
    sceneCode: undefined,
    status: undefined
  })
  getQrCodes()
}

const handleImportItemQuery = () => {
  importItemQuery.pageNo = 1
  getImportItems()
}

const resetImportItemQuery = () => {
  importItemQueryFormRef.value?.resetFields()
  Object.assign(importItemQuery, {
    pageNo: 1,
    pageSize: 10,
    projectId: projectId.value,
    packageId: undefined,
    keyword: undefined,
    reviewStatus: undefined,
    status: undefined
  })
  getImportItems()
}

const openResourcePackageDialog = (row: XunjingConsoleApi.ResourcePackageRespVO) => {
  Object.assign(resourcePackageForm, {
    id: row.id,
    title: row.title,
    versionNo: row.versionNo,
    aiKnowledgeId: row.aiKnowledgeId,
    status: row.status
  })
  resourcePackageDialogVisible.value = true
}

const submitResourcePackage = async () => {
  resourcePackageSubmitLoading.value = true
  try {
    await XunjingConsoleApi.updateResourcePackage(resourcePackageForm)
    message.success('资源包已更新')
    resourcePackageDialogVisible.value = false
    await Promise.all([getResourcePackages(), loadOverview()])
  } finally {
    resourcePackageSubmitLoading.value = false
  }
}

const resolveDefaultPackageId = (preferredPackageId?: number) => {
  return preferredPackageId || resourcePackageList.value[0]?.id || 1
}

const appendFormValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return
  }
  formData.append(key, String(value))
}

const titleFromFileName = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName
}

const openKnowledgeCreateDialog = () => {
  Object.assign(knowledgeCreateForm, {
    packageId: resolveDefaultPackageId(knowledgeQuery.packageId),
    title: '',
    sourceType: 'MANUAL',
    sourceUrl: '',
    contentDigest: '',
    authorityLevel: 'OFFICIAL',
    reviewStatus: 'PENDING',
    vectorStatus: 'PENDING'
  })
  knowledgeUploadFile.value = undefined
  knowledgeCreateDialogVisible.value = true
}

const beforeKnowledgeFileUpload = (file: File) => {
  knowledgeUploadFile.value = file
  if (!knowledgeCreateForm.title?.trim()) {
    knowledgeCreateForm.title = titleFromFileName(file.name)
  }
  return false
}

const handleKnowledgeFileChange = (uploadFile: { raw?: File }) => {
  if (uploadFile.raw) {
    beforeKnowledgeFileUpload(uploadFile.raw)
  }
}

const clearKnowledgeUploadFile = () => {
  knowledgeUploadFile.value = undefined
}

const submitKnowledgeCreate = async () => {
  if (!knowledgeCreateForm.packageId) {
    message.warning('请输入文旅集合 ID')
    return
  }
  if (!knowledgeCreateForm.title?.trim()) {
    message.warning('请输入资料标题')
    return
  }
  knowledgeCreateSubmitLoading.value = true
  try {
    await XunjingConsoleApi.createKnowledgeDocument({
      ...knowledgeCreateForm,
      title: knowledgeCreateForm.title.trim(),
      sourceUrl: knowledgeCreateForm.sourceUrl?.trim() || undefined,
      contentDigest: knowledgeCreateForm.contentDigest?.trim() || undefined
    })
    message.success('文旅资料已入库')
    knowledgeCreateDialogVisible.value = false
    knowledgeQuery.packageId = knowledgeCreateForm.packageId
    await Promise.all([getKnowledgeDocuments(), loadOverview()])
  } finally {
    knowledgeCreateSubmitLoading.value = false
  }
}

const submitKnowledgeUpload = async () => {
  if (!knowledgeCreateForm.packageId) {
    message.warning('请输入文旅集合 ID')
    return
  }
  if (!knowledgeCreateForm.title?.trim()) {
    message.warning('请输入资料标题')
    return
  }
  if (!knowledgeUploadFile.value) {
    message.warning('请选择需要上传的文旅资料文件')
    return
  }
  const formData = new FormData()
  appendFormValue(formData, 'packageId', knowledgeCreateForm.packageId)
  appendFormValue(formData, 'title', knowledgeCreateForm.title.trim())
  appendFormValue(formData, 'authorityLevel', knowledgeCreateForm.authorityLevel)
  formData.append('file', knowledgeUploadFile.value)
  knowledgeCreateSubmitLoading.value = true
  try {
    await XunjingConsoleApi.uploadKnowledgeDocument(formData)
    message.success('文旅资料文件已上传入库')
    knowledgeCreateDialogVisible.value = false
    knowledgeQuery.packageId = knowledgeCreateForm.packageId
    await Promise.all([getKnowledgeDocuments(), loadOverview()])
  } finally {
    knowledgeCreateSubmitLoading.value = false
  }
}

const openMediaCreateDialog = () => {
  Object.assign(mediaCreateForm, {
    packageId: resolveDefaultPackageId(mediaQuery.packageId),
    title: '',
    mediaType: 'IMAGE',
    fileUrl: '',
    objectKey: '',
    sourceProvider: '',
    sourceUrl: '',
    copyrightStatus: 'PENDING',
    reviewStatus: 'PENDING',
    imageTags: '',
    canPublic: true,
    canAiUse: true,
    canPromotionUse: false
  })
  mediaUploadFile.value = undefined
  mediaCreateDialogVisible.value = true
}

const beforeMediaFileUpload = (file: File) => {
  mediaUploadFile.value = file
  if (!mediaCreateForm.title?.trim()) {
    mediaCreateForm.title = titleFromFileName(file.name)
  }
  return false
}

const handleMediaFileChange = (uploadFile: { raw?: File }) => {
  if (uploadFile.raw) {
    beforeMediaFileUpload(uploadFile.raw)
  }
}

const clearMediaUploadFile = () => {
  mediaUploadFile.value = undefined
}

const submitMediaCreate = async () => {
  if (!mediaCreateForm.packageId) {
    message.warning('请输入文旅集合 ID')
    return
  }
  if (!mediaCreateForm.title?.trim()) {
    message.warning('请输入素材标题')
    return
  }
  if (!mediaCreateForm.fileUrl?.trim() && !mediaCreateForm.objectKey?.trim()) {
    message.warning('请输入文件地址或对象 Key')
    return
  }
  mediaCreateSubmitLoading.value = true
  try {
    await XunjingConsoleApi.createMediaAsset({
      ...mediaCreateForm,
      title: mediaCreateForm.title.trim(),
      fileUrl: mediaCreateForm.fileUrl?.trim() || undefined,
      objectKey: mediaCreateForm.objectKey?.trim() || undefined,
      sourceProvider: mediaCreateForm.sourceProvider?.trim() || undefined,
      sourceUrl: mediaCreateForm.sourceUrl?.trim() || undefined,
      imageTags: mediaCreateForm.imageTags?.trim() || undefined
    })
    message.success('图片素材已入库')
    mediaCreateDialogVisible.value = false
    mediaQuery.packageId = mediaCreateForm.packageId
    await Promise.all([getMediaAssets(), loadOverview()])
  } finally {
    mediaCreateSubmitLoading.value = false
  }
}

const submitMediaUpload = async () => {
  if (!mediaCreateForm.packageId) {
    message.warning('请输入文旅集合 ID')
    return
  }
  if (!mediaCreateForm.title?.trim()) {
    message.warning('请输入素材标题')
    return
  }
  if (!mediaUploadFile.value) {
    message.warning('请选择需要上传的图片素材文件')
    return
  }
  const formData = new FormData()
  appendFormValue(formData, 'packageId', mediaCreateForm.packageId)
  appendFormValue(formData, 'title', mediaCreateForm.title.trim())
  appendFormValue(formData, 'mediaType', mediaCreateForm.mediaType)
  appendFormValue(formData, 'sourceProvider', mediaCreateForm.sourceProvider?.trim())
  appendFormValue(formData, 'sourceUrl', mediaCreateForm.sourceUrl?.trim())
  appendFormValue(formData, 'imageTags', mediaCreateForm.imageTags?.trim())
  appendFormValue(formData, 'canPublic', mediaCreateForm.canPublic)
  appendFormValue(formData, 'canAiUse', mediaCreateForm.canAiUse)
  appendFormValue(formData, 'canPromotionUse', mediaCreateForm.canPromotionUse)
  formData.append('file', mediaUploadFile.value)
  mediaCreateSubmitLoading.value = true
  try {
    await XunjingConsoleApi.uploadMediaAsset(formData)
    message.success('图片素材文件已上传入库')
    mediaCreateDialogVisible.value = false
    mediaQuery.packageId = mediaCreateForm.packageId
    await Promise.all([getMediaAssets(), loadOverview()])
  } finally {
    mediaCreateSubmitLoading.value = false
  }
}

const resetReviewForm = (status: string) => {
  Object.assign(reviewForm, {
    id: 0,
    ids: [],
    reviewStatus: status,
    authorityLevel: 'OFFICIAL',
    vectorStatus: status === 'APPROVED' ? 'INDEXED' : 'PENDING',
    copyrightStatus: status === 'APPROVED' ? 'AUTHORIZED' : 'RESTRICTED',
    canPublic: status === 'APPROVED',
    canAiUse: status === 'APPROVED',
    canPromotionUse: false,
    rejectReason: ''
  })
}

const openKnowledgeReviewDialog = (
  row: XunjingConsoleApi.KnowledgeDocumentRespVO,
  status: string
) => {
  reviewTarget.value = 'knowledge'
  resetReviewForm(status)
  reviewForm.id = row.id
  reviewForm.authorityLevel = row.authorityLevel || 'OFFICIAL'
  reviewForm.vectorStatus = status === 'APPROVED' ? 'INDEXED' : row.vectorStatus || 'PENDING'
  reviewDialogVisible.value = true
}

const openMediaReviewDialog = (row: XunjingConsoleApi.MediaAssetRespVO, status: string) => {
  reviewTarget.value = 'media'
  resetReviewForm(status)
  reviewForm.id = row.id
  reviewForm.copyrightStatus =
    status === 'APPROVED' ? 'AUTHORIZED' : row.copyrightStatus || 'RESTRICTED'
  reviewForm.canPublic = status === 'APPROVED' ? row.canPublic !== false : false
  reviewForm.canAiUse = status === 'APPROVED' ? row.canAiUse !== false : false
  reviewForm.canPromotionUse = status === 'APPROVED' ? row.canPromotionUse === true : false
  reviewDialogVisible.value = true
}

const openImportReviewDialog = (status: string, row?: XunjingConsoleApi.ImportItemRespVO) => {
  const ids = row ? [row.id] : checkedImportItemIds.value
  if (ids.length === 0) {
    message.warning('请选择需要审核的资料')
    return
  }
  reviewTarget.value = 'import'
  resetReviewForm(status)
  reviewForm.ids = ids
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  reviewSubmitLoading.value = true
  try {
    if (reviewTarget.value === 'knowledge') {
      await XunjingConsoleApi.reviewKnowledgeDocument({
        id: reviewForm.id,
        reviewStatus: reviewForm.reviewStatus,
        authorityLevel: reviewForm.authorityLevel,
        vectorStatus: reviewForm.vectorStatus
      })
      await getKnowledgeDocuments()
    } else if (reviewTarget.value === 'media') {
      await XunjingConsoleApi.reviewMediaAsset({
        id: reviewForm.id,
        reviewStatus: reviewForm.reviewStatus,
        copyrightStatus: reviewForm.copyrightStatus,
        canPublic: reviewForm.canPublic,
        canAiUse: reviewForm.canAiUse,
        canPromotionUse: reviewForm.canPromotionUse
      })
      await getMediaAssets()
    } else {
      await XunjingConsoleApi.batchReviewImportItems({
        ids: reviewForm.ids,
        reviewStatus: reviewForm.reviewStatus,
        authorityLevel: reviewForm.authorityLevel,
        vectorStatus: reviewForm.vectorStatus,
        rejectReason: reviewForm.rejectReason
      })
      checkedImportItemIds.value = []
      await getImportItems()
    }
    message.success('审核已提交')
    reviewDialogVisible.value = false
    await loadOverview()
  } finally {
    reviewSubmitLoading.value = false
  }
}

const updateQrCode = async (row: XunjingConsoleApi.QrCodeRespVO, status: string) => {
  const text = status === 'ACTIVE' ? '启用' : '停用'
  await message.confirm(`确认${text}二维码「${row.name}」吗？`)
  await XunjingConsoleApi.updateQrCodeStatus({ id: row.id, status })
  message.success(`二维码已${text}`)
  await Promise.all([getQrCodes(), loadOverview()])
}

const handleImportSelectionChange = (rows: XunjingConsoleApi.ImportItemRespVO[]) => {
  checkedImportItemIds.value = rows.map((row) => row.id)
}

const openReportDialog = () => {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  Object.assign(reportForm, {
    projectId: projectId.value,
    schoolId: undefined,
    reportPeriod: month,
    title: `星河寻境公益使用报告 ${month}`
  })
  reportDialogVisible.value = true
}

const submitPublicReport = async () => {
  reportSubmitLoading.value = true
  try {
    const reportId = await XunjingConsoleApi.generatePublicReport(reportForm)
    message.success(`公益报告已生成：#${reportId}`)
    reportDialogVisible.value = false
    await loadOverview()
  } finally {
    reportSubmitLoading.value = false
  }
}

onMounted(() => {
  refreshAll()
})
</script>
