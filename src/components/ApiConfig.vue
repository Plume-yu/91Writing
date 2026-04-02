<template>
  <div class="api-config">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>API配置</span>
          <el-tag :type="isApiConfigured ? 'success' : 'danger'" size="small">
            {{ isApiConfigured ? '已配置' : '未配置' }}
          </el-tag>
        </div>
      </template>
      
      <!-- 主要内容区域 -->
      <div class="config-main-content">
        <!-- 配置表单 -->
        <div class="config-form-panel">
          <el-alert 
            title="本地模型配置" 
            type="info" 
            :closable="false"
            show-icon
          >
            <template #default>
              配置本地AI模型服务地址和参数。
            </template>
          </el-alert>
          
          <el-form :model="customForm" label-width="80px" size="small" class="config-form">
            <el-form-item label="API地址" required>
              <el-input
                v-model="customForm.baseURL"
                placeholder="http://localhost:11434/api"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="模型名称">
              <el-input
                v-model="customForm.selectedModel"
                placeholder="llama3.2"
                clearable
              />
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
            
            <el-form-item label="温度参数">
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
                {{ validating ? '保存中...' : '保存配置' }}
              </el-button>
              <el-button @click="testCustomConnection" :loading="validating">
                测试连接
              </el-button>
              <el-button @click="resetCustomConfig">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
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

// 本地模型配置
const customForm = reactive({
  baseURL: 'http://localhost:11434/api',
  selectedModel: 'llama3.2',
  temperature: 0.7
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
  
  const exists = customModels.value.some(model => model.id === modelName)
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
      customForm.selectedModel = 'llama3.2'
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
    store.updateApiConfig(customForm)
    ElMessage.success('配置保存成功')
    localStorage.setItem('customApiConfig', JSON.stringify(customForm))
  } catch (error) {
    ElMessage.error('配置保存失败：' + error.message)
  } finally {
    validating.value = false
  }
}

const testCustomConnection = async () => {
  validating.value = true
  try {
    const isValid = await store.validateApiKey()
    
    if (isValid) {
      ElMessage.success('连接测试成功')
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
    baseURL: 'http://localhost:11434/api',
    selectedModel: 'llama3.2',
    temperature: 0.7
  })
  localStorage.removeItem('customApiConfig')
  ElMessage.success('配置已重置')
}

// 加载保存的配置
const loadSavedConfig = () => {
  const savedCustom = localStorage.getItem('customApiConfig')
  if (savedCustom) {
    try {
      const config = JSON.parse(savedCustom)
      Object.assign(customForm, config)
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }
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

.config-card {
  max-width: 1600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 主要内容区域 - 单栏布局 */
.config-main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  align-items: start;
}

/* 左侧配置说明面板 */
.config-tips-panel {
  min-height: 400px;
}

.config-tips {
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
}

.config-tips h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.config-tips h5 {
  margin: 16px 0 8px 0;
  color: #34495e;
  font-size: 14px;
  font-weight: 600;
}

.tips-content p {
  margin: 0 0 12px 0;
  color: #5a6c7d;
  line-height: 1.5;
}

.tips-content ul,
.tips-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.tips-content li {
  margin-bottom: 4px;
  color: #5a6c7d;
  line-height: 1.4;
  font-size: 13px;
}

.tips-note {
  margin-top: 16px;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.tips-note p {
  margin: 0;
  font-size: 12px;
  color: #856404;
}

/* 右侧配置表单面板 */
.config-form-panel {
  min-height: 400px;
}

.config-form {
  margin-top: 16px;
  padding: 0 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.custom-model-input {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.custom-models-list {
  margin-top: 8px;
}

/* 响应式布局 */
@media (max-width: 900px) {
  .config-main-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .config-tips-panel,
  .config-form-panel {
    min-height: auto;
  }
  
  .config-card {
    max-width: 100%;
  }
}

@media (max-width: 1200px) and (min-width: 901px) {
  .config-main-content {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
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
</style>
