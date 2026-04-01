<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="🏔️ 地形生成结果" 
    width="900px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="result-container">
      <!-- 生成进度 -->
      <div v-if="isGenerating" class="generating-state">
        <el-progress 
          :percentage="progress" 
          :status="progress >= 100 ? 'success' : undefined"
          :stroke-width="20"
          :format="formatProgress"
        />
        <p class="generating-text">{{ generatingText }}</p>
        
        <!-- 实时生成内容显示 -->
        <div v-if="streamingContent" class="streaming-content">
          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-header">
                <span>📝 实时生成内容</span>
                <el-tag size="small" type="success">AI 生成中</el-tag>
              </div>
            </template>
            <div class="content-text">{{ streamingContent }}</div>
          </el-card>
        </div>
      </div>

      <!-- 生成结果列表 -->
      <div v-else-if="generatedTerrains.length > 0" class="result-list">
        <el-alert 
          title="✅ 地形生成成功" 
          type="success" 
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        >
          <template #default>
            已生成 <strong>{{ generatedTerrains.length }}</strong> 个地形设定，请勾选要导入的地形，然后点击"导入选中的地形"按钮
          </template>
        </el-alert>

        <!-- 批量操作 -->
        <div class="batch-actions">
          <el-checkbox 
            :indeterminate="isIndeterminate"
            :model-value="checkAll"
            @change="handleCheckAllChange"
          >
            全选
          </el-checkbox>
          <span class="selected-count">已选择 {{ selectedTerrains.length }} 个</span>
        </div>

        <el-collapse accordion>
          <el-collapse-item 
            v-for="(terrain, index) in generatedTerrains" 
            :key="index"
            :name="index"
          >
            <template #title>
              <div class="terrain-title">
                <el-checkbox 
                  :model-value="selectedTerrains.includes(terrain.id)"
                  @change="(val) => handleTerrainSelectChange(val, terrain.id)"
                  @click.stop
                />
                <el-tag :type="getTerrainType(terrain.type)" size="small">{{ getTerrainTypeText(terrain.type) }}</el-tag>
                <el-tag :type="getStyleType(terrain.style)" size="small" style="margin-left: 8px;">{{ getStyleText(terrain.style) }}</el-tag>
                <span class="terrain-name">{{ terrain.name }}</span>
              </div>
            </template>

            <div class="terrain-detail">
              <!-- 基本信息 -->
              <div class="detail-section">
                <h4>📍 基本信息</h4>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="名称">{{ terrain.name }}</el-descriptions-item>
                  <el-descriptions-item label="类型">{{ getTerrainTypeText(terrain.type) }}</el-descriptions-item>
                  <el-descriptions-item label="风格">{{ getStyleText(terrain.style) }}</el-descriptions-item>
                  <el-descriptions-item label="规模">{{ getScaleText(terrain.scale) }}</el-descriptions-item>
                  <el-descriptions-item label="世界位置">{{ terrain.worldPosition || '自动生成' }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 层级关系 -->
              <div v-if="terrain.hierarchy" class="detail-section">
                <h4>🏛️ 层级关系</h4>
                <p class="hierarchy-text">{{ terrain.hierarchy }}</p>
              </div>

              <!-- 描述 -->
              <div v-if="terrain.description" class="detail-section">
                <h4>📝 描述</h4>
                <p class="description-text">{{ terrain.description }}</p>
              </div>

              <!-- 传记历史 -->
              <div v-if="terrain.biography" class="detail-section">
                <h4>📜 传记历史</h4>
                <p class="biography-text">{{ terrain.biography }}</p>
              </div>

              <!-- 经济产业 -->
              <div v-if="terrain.economy" class="detail-section">
                <h4>💰 经济产业</h4>
                <p>{{ terrain.economy }}</p>
              </div>

              <!-- 文化特色 -->
              <div v-if="terrain.culture" class="detail-section">
                <h4>🎭 文化特色</h4>
                <p>{{ terrain.culture }}</p>
              </div>

              <!-- 地标建筑 -->
              <div v-if="terrain.landmarks && terrain.landmarks.length" class="detail-section">
                <h4>🏰 地标建筑</h4>
                <el-tag 
                  v-for="(landmark, i) in terrain.landmarks" 
                  :key="i"
                  size="small"
                  style="margin-right: 8px; margin-bottom: 4px;"
                >
                  {{ landmark }}
                </el-tag>
              </div>

              <!-- 相邻地形 -->
              <div v-if="terrain.neighbors && terrain.neighbors.length" class="detail-section">
                <h4>🗺️ 相邻地形</h4>
                <p>{{ terrain.neighbors.join('、') }}</p>
              </div>

              <!-- 特征标签 -->
              <div v-if="terrain.features && terrain.features.length" class="detail-section">
                <h4>🏷️ 特征标签</h4>
                <el-tag 
                  v-for="(feature, i) in terrain.features" 
                  :key="i"
                  effect="plain"
                  size="small"
                  style="margin-right: 8px; margin-bottom: 4px;"
                >
                  {{ feature }}
                </el-tag>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <template #footer>
      <el-button 
        v-if="!isGenerating && generatedTerrains.length > 0" 
        type="primary" 
        @click="handleSaveSelected"
        :loading="isSaving"
        :disabled="selectedTerrains.length === 0"
      >
        <el-icon><Check /></el-icon>
        导入选中的地形 ({{ selectedTerrains.length }})
      </el-button>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import apiService from '@/services/api.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save-terrains', 'close'])

const dialogVisible = ref(props.modelValue)
const isGenerating = ref(true)
const progress = ref(0)
const generatingText = ref('正在连接 AI 服务...')
const generatedTerrains = ref([])
const isSaving = ref(false)
const streamingContent = ref('')
const selectedTerrains = ref([])

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    // 重置状态
    isGenerating.value = true
    progress.value = 0
    generatedTerrains.value = []
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    emit('close')
  }
})

// 调用 AI API 流式生成地形
const generateTerrainsWithAI = async (config) => {
  console.log('开始 AI 流式生成地形，配置:', config)
  streamingContent.value = ''
  selectedTerrains.value = []
  
  try {
    generatingText.value = '正在发送生成请求到 AI 服务...'
    progress.value = 5
    
    // 检查 API 配置
    const apiConfig = localStorage.getItem('customApiConfig')
    if (!apiConfig) {
      throw new Error('未找到 API 配置，请先在 API 配置页面设置 API 地址和密钥')
    }
    
    // 实时处理流式响应
    let fullResponse = ''
    const onChunk = (chunk) => {
      fullResponse += chunk
      streamingContent.value = fullResponse
      // 更新进度（基于响应长度估算）
      progress.value = Math.min(90, 5 + (fullResponse.length / 2000) * 85)
      generatingText.value = `正在生成地形... (${fullResponse.length} 字符)`
    }
    
    // 调用流式 API 生成地形
    const terrains = await apiService.generateTerrainsStream(config, onChunk)
    
    console.log('AI 流式生成地形成功:', terrains)
    progress.value = 95
    generatingText.value = '正在处理生成结果...'
    streamingContent.value = ''
    
    // 为每个地形添加 ID 和默认值
    const processedTerrains = terrains.map((terrain, index) => ({
      id: Date.now() + index,
      ...terrain,
      worldPosition: terrain.worldPosition || '自动生成',
      hierarchy: terrain.hierarchy || '',
      description: terrain.description || '',
      biography: terrain.biography || '',
      economy: terrain.economy || '',
      culture: terrain.culture || '',
      landmarks: terrain.landmarks || [],
      neighbors: terrain.neighbors || [],
      features: terrain.features || []
    }))
    
    progress.value = 100
    setTimeout(() => {
      isGenerating.value = false
      generatedTerrains.value = processedTerrains
      // 默认全选
      selectedTerrains.value = processedTerrains.map(t => t.id)
    }, 500)
    
  } catch (error) {
    console.error('AI 流式生成地形失败:', error)
    generatingText.value = '生成失败：' + error.message
    progress.value = 0
    streamingContent.value = ''
    setTimeout(() => {
      isGenerating.value = false
      ElMessage.error('AI 生成失败：' + error.message)
    }, 1000)
  }
}

const formatProgress = (percentage) => {
  return `${percentage}%`
}

// 计算属性
const checkAll = computed(() => {
  return generatedTerrains.value.length > 0 && 
         selectedTerrains.value.length === generatedTerrains.value.length
})

const isIndeterminate = computed(() => {
  return selectedTerrains.value.length > 0 && 
         selectedTerrains.value.length < generatedTerrains.value.length
})

// 全选处理
const handleCheckAllChange = (val) => {
  if (val) {
    selectedTerrains.value = generatedTerrains.value.map(t => t.id)
  } else {
    selectedTerrains.value = []
  }
}

// 单个地形选择处理
const handleTerrainSelectChange = (val, terrainId) => {
  if (val) {
    selectedTerrains.value.push(terrainId)
  } else {
    selectedTerrains.value = selectedTerrains.value.filter(id => id !== terrainId)
  }
}

// 导入选中的地形
const handleSaveSelected = async () => {
  if (selectedTerrains.value.length === 0) {
    ElMessage.warning('请至少选择一个地形')
    return
  }
  
  isSaving.value = true
  try {
    // 只保存选中的地形
    const terrainsToSave = generatedTerrains.value.filter(t => selectedTerrains.value.includes(t.id))
    emit('save-terrains', terrainsToSave)
    ElMessage.success(`已成功导入 ${terrainsToSave.length} 个地形`)
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

const getTerrainType = (type) => {
  const types = {
    'village': 'success',
    'town': 'primary',
    'city': '',
    'mountain': 'warning',
    'water': 'primary',
    'forest': 'success',
    'plain': 'info',
    'desert': 'warning',
    'island': 'warning'
  }
  return types[type] || ''
}

const getTerrainTypeText = (type) => {
  const texts = {
    'village': '村庄',
    'town': '城镇',
    'city': '城市',
    'mountain': '山地',
    'water': '水域',
    'forest': '森林',
    'plain': '平原',
    'desert': '沙漠',
    'island': '岛屿'
  }
  return texts[type] || type
}

const getStyleType = (style) => {
  const types = {
    'eastern': 'warning',
    'western': 'primary',
    'fantasy': 'danger',
    'sci-fi': 'info'
  }
  return types[style] || ''
}

const getStyleText = (style) => {
  const texts = {
    'eastern': '东方',
    'western': '西方',
    'fantasy': '奇幻',
    'sci-fi': '科幻'
  }
  return texts[style] || style
}

const getScaleText = (scale) => {
  const texts = {
    'small': '小型',
    'medium': '中型',
    'large': '大型',
    'huge': '超大型'
  }
  return texts[scale] || scale
}

const handleSaveAll = async () => {
  isSaving.value = true
  try {
    emit('save-terrains', generatedTerrains.value)
    ElMessage.success('地形已保存到地形列表')
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

// 开始生成（由父组件调用）
const startGeneration = (config) => {
  // 调用 AI API 生成地形
  generateTerrainsWithAI(config)
}

defineExpose({
  startGeneration
})
</script>

<style scoped>
.result-container {
  max-height: 600px;
  overflow-y: auto;
}

.generating-state {
  padding: 40px 20px;
  text-align: center;
}

.generating-text {
  margin-top: 20px;
  font-size: 14px;
  color: #606266;
}

.streaming-content {
  margin-top: 24px;
}

.content-card {
  max-height: 400px;
  overflow: hidden;
}

.content-card :deep(.el-card__header) {
  background: #f5f7fa;
  padding: 12px 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-text {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  background: #fafafa;
  padding: 16px;
  border-radius: 4px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.selected-count {
  font-size: 13px;
  color: #606266;
}

.result-list {
  padding: 10px;
}

.terrain-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terrain-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.terrain-detail {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.hierarchy-text,
.description-text,
.biography-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.description-text,
.biography-text {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}
</style>
