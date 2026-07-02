<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
    >
      <el-alert
        v-if="isAzureOpenAi"
        class="mb-16px"
        type="info"
        :closable="false"
        title="Azure OpenAI 模型填写说明"
        description="“模型标识”请填写 Azure Deployment Name，不要填底层模型家族名；并请为当前平台选择同属 AzureOpenAI 的 API 密钥。聊天与向量模型都遵循这一规则。"
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
      <el-form-item label="模型类型" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="请输入模型类型"
          clearable
          :disabled="formData.id"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_MODEL_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="API 秘钥" prop="keyId">
        <el-select v-model="formData.keyId" :placeholder="apiKeyPlaceholder" clearable>
          <el-option
            v-for="apiKey in filteredApiKeyList"
            :key="apiKey.id"
            :label="apiKey.name"
            :value="apiKey.id"
          />
        </el-select>
        <div class="mt-6px flex items-center gap-8px text-12px text-[var(--el-text-color-secondary)]">
          <span>原始秘钥需先在 API 密钥页录入。</span>
          <el-button link type="primary" v-hasPermi="['ai:api-key:query']" @click="openApiKeyPage">
            去录入 API 密钥
          </el-button>
        </div>
      </el-form-item>
      <el-form-item :label="nameLabel" prop="name">
        <el-input v-model="formData.name" :placeholder="namePlaceholder" />
      </el-form-item>
      <el-form-item :label="modelLabel" prop="model">
        <el-input v-model="formData.model" :placeholder="modelPlaceholder" />
        <div v-if="isAzureOpenAi" class="mt-6px text-12px text-[var(--el-text-color-secondary)]">
          例：聊天模型 `gpt-5.2-chat`，向量模型 `text-embedding-3-small`
        </div>
      </el-form-item>
      <el-form-item label="模型排序" prop="sort">
        <el-input-number v-model="formData.sort" placeholder="请输入模型排序" class="!w-1/1" />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
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
      <el-form-item
        label="温度参数"
        prop="temperature"
        v-if="formData.type === AiModelTypeEnum.CHAT"
      >
        <el-input-number
          v-model="formData.temperature"
          placeholder="请输入温度参数"
          :min="0"
          :max="2"
          :precision="2"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item
        label="回复数 Token 数"
        prop="maxTokens"
        v-if="formData.type === AiModelTypeEnum.CHAT"
      >
        <el-input-number
          v-model="formData.maxTokens"
          placeholder="请输入回复数 Token 数"
          :min="0"
          :max="8192"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item
        label="上下文数量"
        prop="maxContexts"
        v-if="formData.type === AiModelTypeEnum.CHAT"
      >
        <el-input-number
          v-model="formData.maxContexts"
          placeholder="请输入上下文数量"
          :min="0"
          :max="20"
          class="!w-1/1"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { ApiKeyApi, ApiKeyVO } from '@/api/ai/model/apiKey'
import { CommonStatusEnum } from '@/utils/constants'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { AiModelTypeEnum } from '@/views/ai/utils/constants'
import { isAzureOpenAiPlatform } from '../shared/azureOpenAi'

/** API 模型的表单 */
defineOptions({ name: 'ModelForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const router = useRouter() // 路由

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  keyId: undefined,
  name: undefined,
  model: undefined,
  platform: undefined,
  type: undefined,
  sort: undefined,
  status: CommonStatusEnum.ENABLE,
  temperature: undefined,
  maxTokens: undefined,
  maxContexts: undefined
})
const formRules = reactive({
  keyId: [{ required: true, message: 'API 秘钥不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '模型名字不能为空', trigger: 'blur' }],
  model: [{ required: true, message: '模型标识不能为空', trigger: 'blur' }],
  platform: [{ required: true, message: '所属平台不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '模型类型不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  temperature: [{ required: true, message: '温度参数不能为空', trigger: 'blur' }],
  maxTokens: [{ required: true, message: '回复数 Token 数不能为空', trigger: 'blur' }],
  maxContexts: [{ required: true, message: '上下文数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const apiKeyList = ref([] as ApiKeyVO[]) // API 密钥列表
const isAzureOpenAi = computed(() => isAzureOpenAiPlatform(formData.value.platform))
const filteredApiKeyList = computed(() => {
  const platform = String(formData.value.platform || '').trim()
  if (!platform) {
    return apiKeyList.value
  }
  const currentKeyId = formData.value.keyId
  const matched = apiKeyList.value.filter(
    (apiKey) => apiKey.platform === platform || apiKey.id === currentKeyId
  )
  return matched.length ? matched : apiKeyList.value
})
const apiKeyPlaceholder = computed(() =>
  isAzureOpenAi.value ? '请选择 AzureOpenAI API 秘钥' : '请选择 API 秘钥'
)
const nameLabel = computed(() => (isAzureOpenAi.value ? '模型名字（展示名）' : '模型名字'))
const namePlaceholder = computed(() =>
  isAzureOpenAi.value ? '请输入展示名，例如 Azure GPT-5.2 Chat' : '请输入模型名字'
)
const modelLabel = computed(() =>
  isAzureOpenAi.value ? '模型标识（Deployment Name）' : '模型标识'
)
const modelPlaceholder = computed(() =>
  isAzureOpenAi.value
    ? '请输入 Azure Deployment Name，例如 gpt-5.2-chat'
    : '请输入模型标识'
)

watch(
  () => formData.value.platform,
  (platform) => {
    if (!platform || !formData.value.keyId || !apiKeyList.value.length) {
      return
    }
    const keyStillValid = apiKeyList.value.some(
      (apiKey) => apiKey.id === formData.value.keyId && apiKey.platform === platform
    )
    if (!keyStillValid) {
      formData.value.keyId = undefined
    }
  }
)

const openApiKeyPage = () => {
  dialogVisible.value = false
  router.push({ name: 'AiApiKey' })
}

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
      formData.value = await ModelApi.getModel(id)
    } finally {
      formLoading.value = false
    }
  }
  // 获得下拉数据
  const apiKeyPage = await ApiKeyApi.getApiKeyPage({ pageNo: 1, pageSize: 200 })
  apiKeyList.value = apiKeyPage.list || []
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
    const data = formData.value as unknown as ModelVO
    if (data.type !== AiModelTypeEnum.CHAT) {
      delete data.temperature
      delete data.maxTokens
      delete data.maxContexts
    }
    if (formType.value === 'create') {
      await ModelApi.createModel(data)
      message.success(t('common.createSuccess'))
    } else {
      await ModelApi.updateModel(data)
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
    keyId: undefined,
    name: undefined,
    model: undefined,
    platform: undefined,
    type: undefined,
    sort: undefined,
    status: CommonStatusEnum.ENABLE,
    temperature: undefined,
    maxTokens: undefined,
    maxContexts: undefined
  }
  formRef.value?.resetFields()
}
</script>
