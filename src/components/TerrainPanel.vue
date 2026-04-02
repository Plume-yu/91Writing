<template>
  <div class="terrain-panel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>🏔️ 地形管理</span>
          <el-dropdown @command="handleTerrainCommand">
            <el-button size="small" type="primary">
              <el-icon><Plus /></el-icon>
              新增地形 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="manual">手动创建</el-dropdown-item>
                <el-dropdown-item command="ai-batch">AI批量生成</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
      
      <div class="terrain-list">
        <div 
          v-for="terrain in terrainData" 
          :key="terrain.id"
          class="terrain-item"
          @click="selectTerrain(terrain)"
        >
          <div class="terrain-info">
            <h4>{{ terrain.name }}</h4>
            <p class="terrain-desc">{{ terrain.description?.length > 50 ? terrain.description.substring(0, 50) + '...' : terrain.description }}</p>
            <div class="terrain-meta">
              <el-tag size="small">{{ terrain.type || '未知类型' }}</el-tag>
              <el-tag v-if="terrain.size" size="small">{{ terrain.size }}</el-tag>
              <el-tag v-if="terrain.style" size="small" :type="terrain.style === '东方' ? 'success' : 'primary'">{{ terrain.style }}</el-tag>
            </div>
          </div>
          <div class="terrain-actions">
            <el-dropdown @command="(cmd) => handleTerrainAction(cmd, terrain)">
              <el-button size="small" type="text">
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
        
        <div v-if="terrainData.length === 0" class="empty-state">
          <p>暂无地形数据</p>
          <el-button size="small" @click="addTerrain">创建第一个地形</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Edit, Delete, ArrowDown, MoreFilled } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  terrainData: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'select-terrain',
  'add-terrain',
  'edit-terrain',
  'delete-terrain',
  'batch-generate'
])

// Methods
const selectTerrain = (terrain) => {
  emit('select-terrain', terrain)
}

const addTerrain = () => {
  emit('add-terrain')
}

const handleTerrainCommand = (command) => {
  if (command === 'manual') {
    emit('add-terrain')
  } else if (command === 'ai-batch') {
    emit('batch-generate')
  }
}

const handleTerrainAction = (command, terrain) => {
  if (command === 'edit') {
    emit('edit-terrain', terrain)
  } else if (command === 'delete') {
    emit('delete-terrain', terrain)
  }
}
</script>

<style scoped>
.terrain-panel {
  height: 100%;
}

.terrain-list {
  max-height: 600px;
  overflow-y: auto;
}

.terrain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.terrain-item:hover {
  background-color: #f5f7fa;
}

.terrain-info {
  flex: 1;
}

.terrain-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.terrain-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.terrain-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.terrain-actions {
  margin-left: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.empty-state p {
  margin-bottom: 16px;
}
</style>