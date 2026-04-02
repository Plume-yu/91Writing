<template>
  <div class="race-panel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>🧙 种族管理</span>
          <el-dropdown @command="handleRaceCommand">
            <el-button size="small" type="primary">
              <el-icon><Plus /></el-icon>
              新增种族 <el-icon><ArrowDown /></el-icon>
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
      
      <div class="race-list">
        <div 
          v-for="race in raceData" 
          :key="race.id"
          class="race-item"
          @click="selectRace(race)"
        >
          <div class="race-info">
            <h4>{{ race.name }}</h4>
            <p class="race-desc">{{ race.description?.length > 50 ? race.description.substring(0, 50) + '...' : race.description }}</p>
            <div class="race-meta">
              <el-tag size="small">{{ race.type || '未知类型' }}</el-tag>
              <el-tag v-if="race.style" size="small" :type="race.style === '东方' ? 'success' : 'primary'">{{ race.style }}</el-tag>
            </div>
          </div>
          <div class="race-actions">
            <el-dropdown @command="(cmd) => handleRaceAction(cmd, race)">
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
        
        <div v-if="raceData.length === 0" class="empty-state">
          <p>暂无种族数据</p>
          <el-button size="small" @click="addRace">创建第一个种族</el-button>
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
  raceData: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'select-race',
  'add-race',
  'edit-race',
  'delete-race',
  'batch-generate'
])

// Methods
const selectRace = (race) => {
  emit('select-race', race)
}

const addRace = () => {
  emit('add-race')
}

const handleRaceCommand = (command) => {
  if (command === 'manual') {
    emit('add-race')
  } else if (command === 'ai-batch') {
    emit('batch-generate')
  }
}

const handleRaceAction = (command, race) => {
  if (command === 'edit') {
    emit('edit-race', race)
  } else if (command === 'delete') {
    emit('delete-race', race)
  }
}
</script>

<style scoped>
.race-panel {
  height: 100%;
}

.race-list {
  max-height: 600px;
  overflow-y: auto;
}

.race-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.race-item:hover {
  background-color: #f5f7fa;
}

.race-info {
  flex: 1;
}

.race-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.race-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.race-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.race-actions {
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