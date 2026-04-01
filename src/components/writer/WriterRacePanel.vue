<template>
  <div class="panel-content">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>🧙 种族设定</span>
          <div class="race-actions">
            <el-button size="small" type="primary" @click="$emit('add-race')">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
            <el-button size="small" type="success" @click="$emit('batch-generate')">
              🤖 AI 批量生成
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="race-list">
        <div v-for="race in races" :key="race.id" class="race-item">
          <div class="race-content" @click="$emit('edit-race', race)">
            <div class="race-avatar">
              <img v-if="race.icon" :src="race.icon" />
              <div v-else class="default-avatar">{{ race.name?.charAt(0) || '？' }}</div>
            </div>
            <div class="race-info">
              <h4>{{ race.name }}</h4>
              <div class="race-meta">
                <el-tag :type="getRaceLevel(race.level)" size="small">{{ getRaceLevelText(race.level) }}</el-tag>
                <el-tag v-if="race.affiliation" type="info" size="small">{{ race.affiliation }}</el-tag>
              </div>
              <el-tooltip 
                v-if="race.description" 
                :content="race.description" 
                placement="right"
                :disabled="race.description.length <= 60"
                effect="light"
                :show-after="300"
              >
                <p class="race-desc race-desc-truncated">
                  {{ race.description.length > 60 ? race.description.substring(0, 60) + '...' : race.description }}
                </p>
              </el-tooltip>
              <div class="race-traits" v-if="race.traits && race.traits.length">
                <el-tag v-for="trait in race.traits" :key="trait" size="small" effect="plain">{{ trait }}</el-tag>
              </div>
            </div>
          </div>
          <div class="race-actions">
            <el-dropdown @command="(cmd) => $emit('race-action', cmd, race)" trigger="click">
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
        
        <div v-if="races.length === 0" class="empty-state">
          <p>暂无种族设定</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Plus, MoreFilled, Edit, Delete } from '@element-plus/icons-vue'

defineProps({
  races: {
    type: Array,
    required: true
  }
})

defineEmits([
  'add-race',
  'batch-generate',
  'edit-race',
  'race-action'
])

const getRaceLevel = (level) => {
  const levels = {
    'common': 'info',
    'rare': 'primary',
    'epic': 'warning',
    'legendary': 'danger'
  }
  return levels[level] || ''
}

const getRaceLevelText = (level) => {
  const texts = {
    'common': '普通',
    'rare': '稀有',
    'epic': '史诗',
    'legendary': '传说'
  }
  return texts[level] || level
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

.race-actions {
  display: flex;
  gap: 8px;
}

.race-list {
  max-height: calc(100vh - 200px);
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding-bottom: 10px;
  width: 100%;
}

.race-item {
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

.race-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.race-content {
  display: flex;
  flex: 1;
  cursor: pointer;
}

.race-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.race-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.race-info {
  flex: 1;
}

.race-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.race-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.race-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 8px;
}

.race-desc-truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.race-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.race-actions {
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
