<template>
  <div class="panel-content">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>🏔️ 地形环境</span>
          <div class="terrain-actions">
            <el-button size="small" type="primary" @click="$emit('add-terrain')">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
            <el-button size="small" type="success" @click="showBatchGenerateDialog">
              🤖 AI 批量生成
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="terrain-list">
        <div v-for="terrain in terrains" :key="terrain.id" class="terrain-item">
          <div class="terrain-content" @click="$emit('edit-terrain', terrain)">
            <div class="terrain-icon">
              <el-icon :size="24"><Location /></el-icon>
            </div>
            <div class="terrain-info">
              <h4>{{ terrain.name }}</h4>
              <div class="terrain-meta">
                <el-tag :type="getTerrainType(terrain.type)" size="small">{{ getTerrainTypeText(terrain.type) }}</el-tag>
                <el-tag v-if="terrain.style" :type="getStyleType(terrain.style)" size="small">{{ getStyleText(terrain.style) }}</el-tag>
                <span v-if="terrain.hierarchy" class="hierarchy-text" title="层级关系">📍 {{ terrain.hierarchy }}</span>
              </div>
              <el-tooltip 
                v-if="terrain.description" 
                :content="terrain.description" 
                placement="right"
                :disabled="terrain.description.length <= 60"
                effect="light"
                :show-after="300"
              >
                <p class="terrain-desc terrain-desc-truncated">
                  {{ terrain.description.length > 60 ? terrain.description.substring(0, 60) + '...' : terrain.description }}
                </p>
              </el-tooltip>
              <div class="terrain-tags" v-if="terrain.features && terrain.features.length">
                <el-tag v-for="feature in terrain.features" :key="feature" size="small" effect="plain">{{ feature }}</el-tag>
              </div>
            </div>
          </div>
          <div class="terrain-actions">
            <el-dropdown @command="(cmd) => $emit('terrain-action', cmd, terrain)" trigger="click">
              <el-button size="small" type="text" @click.stop>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div v-if="terrains.length === 0" class="empty-state">
          <p>暂无地形设定</p>
        </div>
      </div>
    </el-card>

    <!-- 批量生成对话框 -->
    <TerrainBatchGenerateDialog
      v-model="batchDialogVisible"
      @generate="handleBatchGenerate"
    />

    <!-- 生成结果展示对话框 -->
    <TerrainGenerateResultDialog
      ref="resultDialogRef"
      v-model="resultDialogVisible"
      @save-terrains="handleSaveGeneratedTerrains"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus, MoreFilled, Edit, Delete, Location } from '@element-plus/icons-vue'
import TerrainBatchGenerateDialog from './TerrainBatchGenerateDialog.vue'
import TerrainGenerateResultDialog from './TerrainGenerateResultDialog.vue'

defineProps({
  terrains: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'add-terrain',
  'batch-generate',
  'edit-terrain',
  'terrain-action',
  'save-terrains'
])

const batchDialogVisible = ref(false)
const resultDialogVisible = ref(false)
const resultDialogRef = ref(null)

const showBatchGenerateDialog = () => {
  batchDialogVisible.value = true
}

const handleBatchGenerate = (config) => {
  console.log('收到生成配置:', config)
  // 关闭配置对话框
  batchDialogVisible.value = false
  // 立即显示结果对话框并开始生成
  resultDialogVisible.value = true
  // 直接调用生成方法，不等待
  if (resultDialogRef.value) {
    resultDialogRef.value.startGeneration(config)
  } else {
    console.error('结果对话框引用未找到')
  }
}

const handleSaveGeneratedTerrains = (terrains) => {
  // 将生成的地形保存到地形列表
  emit('save-terrains', terrains)
}

const getTerrainIcon = (type) => {
  return Location
}

const getTerrainType = (type) => {
  const types = {
    'mountain': 'warning',
    'water': 'primary',
    'forest': 'success',
    'plain': 'info',
    'desert': 'warning',
    'city': '',
    'village': 'success',
    'town': 'primary',
    'island': 'warning'
  }
  return types[type] || ''
}

const getTerrainTypeText = (type) => {
  const texts = {
    'mountain': '山地',
    'water': '水域',
    'forest': '森林',
    'plain': '平原',
    'desert': '沙漠',
    'city': '城市',
    'village': '村庄',
    'town': '城镇',
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
</script>

<style scoped>
.panel-content {
  height: 100%;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terrain-actions {
  display: flex;
  gap: 8px;
}

.terrain-list {
  max-height: calc(100vh - 200px);
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding-bottom: 10px;
  width: 100%;
}

.terrain-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 300px;
  flex: 1;
}

.terrain-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.terrain-content {
  display: flex;
  flex: 1;
  cursor: pointer;
}

.terrain-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.terrain-info {
  flex: 1;
}

.terrain-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.terrain-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.hierarchy-text {
  font-size: 12px;
  color: #909399;
}

.area-text {
  font-size: 12px;
  color: #909399;
}

.terrain-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 8px;
}

.terrain-desc-truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terrain-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.terrain-actions {
  margin-left: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state p {
  margin-bottom: 16px;
}
</style>
