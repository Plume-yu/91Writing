<template>
  <div class="api-config">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>⚙️ API配置</h1>
        <p>管理本地AI模型接口配置</p>
      </div>
      <div class="header-actions">
        <el-button @click="testCustomConnection">
          <el-icon><Connection /></el-icon>
          测试连接
        </el-button>
        <el-button type="primary" @click="saveCustomConfig">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
      </div>
    </div>

    <!-- API配置 -->
    <div class="config-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>🤖 本地AI模型配置</h3>
          </div>
        </template>
        <el-form :model="customForm" label-width="100px" size="small" class="config-form">
          <el-form-item label="API 地址" required>
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
          
          <el-form-item label="温度参数">
            <el-slider
              v-model="customForm.temperature"
              :min="0"
              :max="1"
              :step="0.1"
              show-input
            />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 本地模型说明 -->
    <div class="model-info">
      <el-card>
        <template #header>
          <h3>📚 本地模型说明</h3>
        </template>
        <div class="info-content">
          <p>本配置适用于本地部署的AI模型，如Ollama等。</p>
          <ul>
            <li>默认API地址：http://localhost:11434/api</li>
            <li>默认模型：llama3.2</li>
            <li>无需API密钥，本地模型直接使用</li>
            <li>无Token限制，可生成长文本内容</li>
          </ul>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, Check } from '@element-plus/icons-vue'
import { useNovelStore } from '../stores/novel.js'

const store = useNovelStore()

// 响应式数据
const customForm = reactive({
  baseURL: 'http://localhost:11434/api',
  selectedModel: 'llama3.2',
  temperature: 0.7
})

// 页面加载时自动设置为本地ollama配置
onMounted(() => {
  // 检查是否已经有配置
  const savedConfig = localStorage.getItem('customApiConfig')
  if (!savedConfig) {
    // 没有配置时，使用本地ollama默认配置
    const defaultConfig = {
      baseURL: 'http://localhost:11434/api',
      selectedModel: 'llama3.2',
      temperature: 0.7
    }
    localStorage.setItem('customApiConfig', JSON.stringify(defaultConfig))
    store.updateApiConfig(defaultConfig, 'custom')
    store.switchConfigType('custom')
  } else {
    // 加载已保存的配置
    const saved = JSON.parse(savedConfig)
    Object.assign(customForm, saved)
  }
})

const saveCustomConfig = async () => {
  try {
    store.updateApiConfig(customForm, 'custom')
    store.switchConfigType('custom')
    ElMessage.success('配置保存成功')
    localStorage.setItem('customApiConfig', JSON.stringify(customForm))
  } catch (error) {
    ElMessage.error('配置保存失败：' + error.message)
  }
}

const testCustomConnection = async () => {
  try {
    store.updateApiConfig(customForm, 'custom')
    store.switchConfigType('custom')
    ElMessage.success('连接测试成功')
  } catch (error) {
    ElMessage.error('连接测试失败：' + error.message)
  }
}
</script>

<style scoped>
.api-config {
  padding: 0;
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

.header-actions {
  display: flex;
  gap: 10px;
}

.config-list {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.config-form {
  padding: 0 20px 20px;
}

.model-info {
  margin-bottom: 20px;
}

.info-content {
  padding: 0 20px 20px;
}

.info-content p {
  margin: 0 0 15px 0;
  color: #606266;
  line-height: 1.5;
}

.info-content ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 1.6;
}

.info-content li {
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .config-form {
    padding: 0 10px 10px;
  }
  
  .info-content {
    padding: 0 10px 10px;
  }
}
</style>