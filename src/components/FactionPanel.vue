<template>
  <div class="faction-panel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>🏰 势力管理</span>
          <el-dropdown @command="handleFactionCommand">
            <el-button size="small" type="primary">
              <el-icon><Plus /></el-icon>
              新增势力 <el-icon><ArrowDown /></el-icon>
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
      
      <div class="faction-list">
        <div 
          v-for="faction in factionData" 
          :key="faction.id"
          class="faction-item"
          @click="selectFaction(faction)"
        >
          <div class="faction-info">
            <h4>{{ faction.name }}</h4>
            <p class="faction-desc">{{ faction.description?.length > 50 ? faction.description.substring(0, 50) + '...' : faction.description }}</p>
            <div class="faction-meta">
              <el-tag size="small">{{ faction.terrain || '未知领地' }}</el-tag>
              <el-tag size="small">{{ faction.race || '未知种族' }}</el-tag>
            </div>
          </div>
          <div class="faction-actions">
            <el-dropdown @command="(cmd) => handleFactionAction(cmd, faction)">
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
        
        <div v-if="factionData.length === 0" class="empty-state">
          <p>暂无势力数据</p>
          <el-button size="small" @click="addFaction">创建第一个势力</el-button>
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
  factionData: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'select-faction',
  'add-faction',
  'edit-faction',
  'delete-faction',
  'batch-generate'
])

// Methods
const selectFaction = (faction) => {
  emit('select-faction', faction)
}

const addFaction = () => {
  emit('add-faction')
}

const handleFactionCommand = (command) => {
  if (command === 'manual') {
    emit('add-faction')
  } else if (command === 'ai-batch') {
    emit('batch-generate')
  }
}

const handleFactionAction = (command, faction) => {
  if (command === 'edit') {
    emit('edit-faction', faction)
  } else if (command === 'delete') {
    emit('delete-faction', faction)
  }
}
</script>

<style scoped>
.faction-panel {
  height: 100%;
}

.faction-list {
  max-height: 600px;
  overflow-y: auto;
}

.faction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.faction-item:hover {
  background-color: #f5f7fa;
}

.faction-info {
  flex: 1;
}

.faction-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.faction-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.faction-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.faction-actions {
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