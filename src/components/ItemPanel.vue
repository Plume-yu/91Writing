<template>
  <div class="item-panel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>🎒 物品管理</span>
          <el-dropdown @command="handleItemCommand">
            <el-button size="small" type="primary">
              <el-icon><Plus /></el-icon>
              新增物品 <el-icon><ArrowDown /></el-icon>
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
      
      <div class="item-list">
        <div 
          v-for="item in itemData" 
          :key="item.id"
          class="item-item"
          @click="selectItem(item)"
        >
          <div class="item-info">
            <h4>{{ item.name }}</h4>
            <p class="item-desc">{{ item.description?.length > 50 ? item.description.substring(0, 50) + '...' : item.description }}</p>
            <div class="item-meta">
              <el-tag :type="getItemLevelType(item.level)" size="small">
                等级 {{ item.level }}
              </el-tag>
              <el-tag v-if="item.style" size="small" :type="item.style === '东方' ? 'success' : 'primary'">{{ item.style }}</el-tag>
            </div>
          </div>
          <div class="item-actions">
            <el-dropdown @command="(cmd) => handleItemAction(cmd, item)">
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
        
        <div v-if="itemData.length === 0" class="empty-state">
          <p>暂无物品数据</p>
          <el-button size="small" @click="addItem">创建第一个物品</el-button>
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
  itemData: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'select-item',
  'add-item',
  'edit-item',
  'delete-item',
  'batch-generate'
])

// Methods
const selectItem = (item) => {
  emit('select-item', item)
}

const addItem = () => {
  emit('add-item')
}

const handleItemCommand = (command) => {
  if (command === 'manual') {
    emit('add-item')
  } else if (command === 'ai-batch') {
    emit('batch-generate')
  }
}

const handleItemAction = (command, item) => {
  if (command === 'edit') {
    emit('edit-item', item)
  } else if (command === 'delete') {
    emit('delete-item', item)
  }
}

const getItemLevelType = (level) => {
  if (level === 5) return 'danger'
  if (level === 4) return 'warning'
  if (level === 3) return 'primary'
  if (level === 2) return 'success'
  return 'info'
}
</script>

<style scoped>
.item-panel {
  height: 100%;
}

.item-list {
  max-height: 600px;
  overflow-y: auto;
}

.item-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.item-item:hover {
  background-color: #f5f7fa;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.item-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.item-actions {
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