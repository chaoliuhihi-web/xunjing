<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-alert
        v-if="isAzureOpenAi"
        class="mb-16px"
        type="info"
        :closable="false"
        title="Azure OpenAI 填写说明"
        description="请填写 Azure OpenAI 资源级 Endpoint（*.openai.azure.com），不要填写 Foundry Project Endpoint（...services.ai.azure.com/api/projects/...）。聊天/向量模型页里的“模型标识”请填写 Deployment Name。"
      />
      <el-form-item label="所属平台" prop="platform">
        <el-select v-model="formData.platform" placeholder="请输入平台" clearable>
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.AI_PLATFORM)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" :placeholder="namePlaceholder" />
      </el-form-item>
      <el-form-item label="密钥" prop="apiKey">
        <el-input v-model="formData.apiKey" :placeholder="apiKeyPlaceholder" />
      </el-form-item>
      <el-form-item :label="urlLabel" prop="url">
        <el-input v-model="formData.url" :placeholder="urlPlaceholder" />
        <div v-if="isAzureOpenAi" class="mt-6px text-12px text-[var(--el-text-color-secondary)]">
          例：{{ azureEndpointExample }}
        </div>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { ApiKeyApi, ApiKeyVO } from '@/api/ai/model/apiKey'
import { CommonStatusEnum } from '@/utils/constants'
import {
  AZURE_OPENAI_ENDPOINT_EXAMPLE,
  isAzureFoundryEndpoint,
  isAzureOpenAiPlatform,
  isAzureOpenAiProjectEndpoint,
  isAzureOpenAiResourceEndpoint,
  normalizeAzureOpenAiEndpoint
} from '../shared/azureOpenAi'

/** AI API 密钥 表单 */
defineOptions({ name: 'ApiKeyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  apiKey: undefined,
  platform: undefined,
  url: undefined,
  status: CommonStatusEnum.ENABLE
})
const isAzureOpenAi = computed(() => isAzureOpenAiPlatform(formData.value.platform))
const azureEndpointExample = AZURE_OPENAI_ENDPOINT_EXAMPLE
const namePlaceholder = computed(() =>
  isAzureOpenAi.value ? '请输入名称，例如 azure-book260304' : '请输入名称'
)
const apiKeyPlaceholder = computed(() =>
  isAzureOpenAi.value ? '请输入 Azure OpenAI API Key' : '请输入密钥'
)
const urlLabel = computed(() => (isAzureOpenAi.value ? 'Azure OpenAI Endpoint' : '自定义 API URL'))
const urlPlaceholder = computed(() =>
  isAzureOpenAi.value
    ? `请输入 Azure OpenAI 资源级 Endpoint，例如 ${AZURE_OPENAI_ENDPOINT_EXAMPLE}`
    : '请输入自定义 API URL'
)
const validateUrl = (_rule: any, value: string, callback: (error?: Error) => void) => {
  const raw = String(value || '').trim()
  if (!isAzureOpenAi.value) {
    callback()
    return
  }
  if (!raw) {
    callback(new Error('Azure OpenAI Endpoint 不能为空'))
    return
  }
  if (isAzureOpenAiProjectEndpoint(raw) || isAzureFoundryEndpoint(raw)) {
    callback(new Error('请填写 Azure OpenAI 资源级 Endpoint，不要填写 Foundry / Project Endpoint'))
    return
  }
  if (!isAzureOpenAiResourceEndpoint(raw)) {
    callback(new Error(`请填写 Azure OpenAI 资源级 Endpoint，例如 ${AZURE_OPENAI_ENDPOINT_EXAMPLE}`))
    return
  }
  callback()
}
const formRules = reactive({
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  apiKey: [{ required: true, message: '密钥不能为空', trigger: 'blur' }],
  platform: [{ required: true, message: '平台不能为空', trigger: 'blur' }],
  url: [{ validator: validateUrl, trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ApiKeyApi.getApiKey(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ApiKeyVO
    if (isAzureOpenAiPlatform(data.platform)) {
      data.url = normalizeAzureOpenAiEndpoint(data.url)
    }
    if (formType.value === 'create') {
      await ApiKeyApi.createApiKey(data)
      message.success(t('common.createSuccess'))
    } else {
      await ApiKeyApi.updateApiKey(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: undefined,
    apiKey: undefined,
    platform: undefined,
    url: undefined,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
