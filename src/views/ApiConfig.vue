<template>
  <div class="api-config">
    <div class="page-header">
      <div class="header-content">
        <h1>⚙️ API 配置</h1>
        <p>管理 AI 模型接口配置和参数设置</p>
      </div>
    </div>

    <div class="config-form-container">
      <el-alert 
        title="自定义配置" 
        type="warning" 
        :closable="false"
        show-icon
      >
        <template #default>
          高级用户可自定义 API 地址和模型参数。
        </template>
      </el-alert>
        
      <el-form :model="customForm" label-width="100px" size="small" class="config-form">
        <el-form-item label="API 地址" required>
          <el-input
            v-model="customForm.baseURL"
            placeholder="https://api.openai.com/v1"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="模型选择">
          <el-select 
            v-model="customForm.selectedModel" 
            placeholder="选择模型"
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            >
              <span>{{ model.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 12px">
                {{ model.description }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="自定义模型">
          <div class="custom-model-input">
            <el-input
              v-model="customModelInput"
              placeholder="输入自定义模型名称"
              @keyup.enter="addCustomModel"
            />
            <el-button @click="addCustomModel" type="primary" size="small">添加</el-button>
          </div>
          <div v-if="customModels.length > 0" class="custom-models-list">
            <el-tag
              v-for="model in customModels"
              :key="model.id"
              closable
              @close="removeCustomModel(model.id)"
              size="small"
              style="margin-right: 8px; margin-bottom: 4px;"
            >
              {{ model.name }}
            </el-tag>
          </div>
        </el-form-item>
        
        <el-form-item label="创造性">
          <el-slider
            v-model="customForm.temperature"
            :min="0"
            :max="1"
            :step="0.1"
            :format-tooltip="formatTemperature"
            show-tooltip
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="saveCustomConfig" :loading="validating">
            {{ validating ? '验证中...' : '保存配置' }}
          </el-button>
          <el-button @click="testCustomConnection" :loading="validating">
            测试连接
          </el-button>
          <el-button @click="resetCustomConfig">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useNovelStore } from '../stores/novel.js'

const store = useNovelStore()
const validating = ref(false)
const customModelInput = ref('')
const customModels = ref([])

const customForm = reactive({
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  selectedModel: 'gpt-3.5-turbo',
  temperature: 0.7
})

const defaultModels = [
  { id: 'deepseek-reasoner', name: 'deepseek-r1', description: 'deepseek-r1' },
  { id: 'deepseek-chat', name: 'deepseek-v3', description: 'deepseek-v3' },
  { id: 'claude-3.7-sonnet', name: 'claude-3.7-sonnet', description: 'claude-3.7-sonnet' },
  { id: 'claude-4-sonnet', name: 'claude-4-sonnet', description: 'claude-4-sonnet' },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'gemini-2.5-pro-preview-05-06', description: 'gemini-2.5-pro-preview-05-06' }
]

const availableModels = computed(() => {
  return [...defaultModels, ...customModels.value]
})

const isApiConfigured = computed(() => store.isApiConfigured)

const formatTemperature = (value) => {
  if (value <= 0.3) return '保守'
  if (value <= 0.7) return '平衡'
  return '创新'
}

const addCustomModel = () => {
  const modelName = customModelInput.value.trim()
  if (!modelName) return
  
  const exists = availableModels.value.some(model => model.id === modelName)
  if (exists) {
    ElMessage.warning('该模型已存在')
    return
  }
  
  customModels.value.push({
    id: modelName,
    name: modelName,
    description: '自定义模型'
  })
  
  customModelInput.value = ''
  ElMessage.success('自定义模型添加成功')
  saveCustomModels()
}

const removeCustomModel = (modelId) => {
  const index = customModels.value.findIndex(model => model.id === modelId)
  if (index > -1) {
    customModels.value.splice(index, 1)
    
    if (customForm.selectedModel === modelId) {
      customForm.selectedModel = 'gpt-3.5-turbo'
    }
    
    ElMessage.success('自定义模型删除成功')
    saveCustomModels()
  }
}

const saveCustomModels = () => {
  localStorage.setItem('customModels', JSON.stringify(customModels.value))
}

const loadCustomModels = () => {
  const saved = localStorage.getItem('customModels')
  if (saved) {
    try {
      customModels.value = JSON.parse(saved)
    } catch (error) {
      console.error('加载自定义模型失败:', error)
    }
  }
}

const saveCustomConfig = async () => {
  validating.value = true
  try {
    store.updateApiConfig(customForm, 'custom')
    store.switchConfigType('custom')
    const isValid = await store.validateApiKey()
    
    if (isValid) {
      ElMessage.success('自定义配置保存成功')
      localStorage.setItem('customApiConfig', JSON.stringify(customForm))
    } else {
      ElMessage.error('API 密钥验证失败，请检查配置')
    }
  } catch (error) {
    ElMessage.error('配置保存失败：' + error.message)
  } finally {
    validating.value = false
  }
}

const testCustomConnection = async () => {
  validating.value = true
  try {
    store.updateApiConfig(customForm, 'custom')
    store.switchConfigType('custom')
    const isValid = await store.validateApiKey()
    
    if (isValid) {
      ElMessage.success('自定义配置连接测试成功')
    } else {
      ElMessage.error('连接测试失败')
    }
  } catch (error) {
    ElMessage.error('连接测试失败：' + error.message)
  } finally {
    validating.value = false
  }
}

const resetCustomConfig = () => {
  Object.assign(customForm, {
    apiKey: '',
    baseURL: 'https://api.openai.com/v1',
    selectedModel: 'gpt-3.5-turbo',
    temperature: 0.7
  })
  localStorage.removeItem('customApiConfig')
  ElMessage.success('自定义配置已重置')
}

const loadSavedConfig = () => {
  const savedCustom = localStorage.getItem('customApiConfig')
  if (savedCustom) {
    try {
      const config = JSON.parse(savedCustom)
      Object.assign(customForm, config)
    } catch (error) {
      console.error('加载自定义配置失败:', error)
    }
  }
  
  store.updateApiConfig(customForm, 'custom')
  store.switchConfigType('custom')
}

onMounted(() => {
  loadCustomModels()
  loadSavedConfig()
})
</script>

<style scoped>
.api-config {
  padding: 20px;
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content h1 {
  margin: 0 0 5px 0;
  font-size: 24px;
  color: #303133;
}

.header-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.config-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.config-form {
  margin-top: 16px;
}

.custom-model-input {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.custom-models-list {
  margin-top: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-slider__runway) {
  margin: 16px 0;
}

:deep(.el-alert) {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .config-form-container {
    padding: 16px;
  }
}
</style>
