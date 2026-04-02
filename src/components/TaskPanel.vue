<template>
  <div class="task-panel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>📋 任务管理</span>
          <el-dropdown @command="handleTaskCommand">
            <el-button size="small" type="primary">
              <el-icon><Plus /></el-icon>
              新增任务 <el-icon><ArrowDown /></el-icon>
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
      
      <div class="task-list">
        <div 
          v-for="task in taskData" 
          :key="task.id"
          class="task-item"
          @click="selectTask(task)"
        >
          <div class="task-info">
            <h4>{{ task.name }}</h4>
            <p class="task-desc">{{ task.description?.length > 50 ? task.description.substring(0, 50) + '...' : task.description }}</p>
            <div class="task-meta">
              <el-tag :type="getTaskStatusType(task.status)" size="small">{{ getTaskStatusText(task.status) }}</el-tag>
              <el-tag v-if="task.level" size="small">难度: {{ task.level }}</el-tag>
              <el-tag v-if="task.reward" size="small">奖励: {{ task.reward }}</el-tag>
            </div>
          </div>
          <div class="task-actions">
            <el-dropdown @command="(cmd) => handleTaskAction(cmd, task)">
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
        
        <div v-if="taskData.length === 0" class="empty-state">
          <p>暂无任务数据</p>
          <el-button size="small" @click="addTask">创建第一个任务</el-button>
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
  taskData: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'select-task',
  'add-task',
  'edit-task',
  'delete-task',
  'batch-generate'
])

// Methods
const selectTask = (task) => {
  emit('select-task', task)
}

const addTask = () => {
  emit('add-task')
}

const handleTaskCommand = (command) => {
  if (command === 'manual') {
    emit('add-task')
  } else if (command === 'ai-batch') {
    emit('batch-generate')
  }
}

const handleTaskAction = (command, task) => {
  if (command === 'edit') {
    emit('edit-task', task)
  } else if (command === 'delete') {
    emit('delete-task', task)
  }
}

const getTaskStatusType = (status) => {
  if (status === '未开始') return 'info'
  if (status === '进行中') return 'warning'
  if (status === '已完成') return 'success'
  if (status === '失败') return 'danger'
  return 'info'
}

const getTaskStatusText = (status) => {
  return status || '未知状态'
}
</script>

<style scoped>
.task-panel {
  height: 100%;
}

.task-list {
  max-height: 600px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.task-item:hover {
  background-color: #f5f7fa;
}

.task-info {
  flex: 1;
}

.task-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.task-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.task-actions {
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