<template>
  <div class="faction-panel">
    <div class="panel-header">
      <h3>🏰 势力管理</h3>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="$emit('add-faction')">
          <el-icon><Plus /></el-icon>
          新增势力
        </el-button>
        <el-button type="success" size="small" @click="$emit('batch-generate')">
          <el-icon><MagicStick /></el-icon>
          AI 批量生成
        </el-button>
      </div>
    </div>

    <div class="faction-list">
      <div v-if="factions.length === 0" class="empty-state">
        <el-empty description="暂无势力数据">
        </el-empty>
      </div>

      <div v-else class="faction-grid">
        <div
          v-for="faction in factions"
          :key="faction.id"
          class="faction-card"
          @click="$emit('edit-faction', faction)"
        >
          <div class="faction-avatar">
            <div class="default-avatar">{{ faction.name?.charAt(0) || '？' }}</div>
          </div>

          <div class="faction-info">
            <h4 class="faction-name">{{ faction.name }}</h4>
            <div class="faction-meta">
              <el-tag v-if="faction.type" size="small" type="primary">{{ faction.type }}</el-tag>
              <el-tag v-if="faction.power" size="small" :type="getPowerType(faction.power)">
                {{ getPowerText(faction.power) }}
              </el-tag>
            </div>
            <p class="faction-description">{{ faction.description || '暂无描述' }}</p>

            <div class="faction-stats">
              <div class="stat-item" v-if="faction.territories?.length">
                <el-icon><Location /></el-icon>
                <span>{{ faction.territories.length }} 个领地</span>
              </div>
              <div class="stat-item" v-if="faction.members?.length">
                <el-icon><User /></el-icon>
                <span>{{ faction.members.length }} 名成员</span>
              </div>
              <div class="stat-item" v-if="faction.races?.length">
                <el-icon><UserFilled /></el-icon>
                <span>{{ faction.races.length }} 个种族</span>
              </div>
            </div>
          </div>

          <div class="faction-actions">
            <el-dropdown @command="(cmd) => $emit('faction-action', cmd, faction)">
              <el-button circle size="small">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { Plus, MagicStick, Location, User, UserFilled, MoreFilled, Edit, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  factions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add-faction', 'edit-faction', 'faction-action', 'batch-generate'])

const getPowerType = (power) => {
  const powerMap = {
    'weak': 'info',
    'medium': 'warning',
    'strong': 'success',
    'dominant': 'danger'
  }
  return powerMap[power] || 'info'
}

const getPowerText = (power) => {
  const powerMap = {
    'weak': '弱小',
    'medium': '中等',
    'strong': '强大',
    'dominant': '霸主'
  }
  return powerMap[power] || '未知'
}
</script>

<style scoped>
.faction-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.faction-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 400px;
}

.faction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  width: 100%;
}

.faction-card {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.faction-card:hover {
  background: #fff;
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.faction-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  border-radius: 8px;
}

.faction-info {
  flex: 1;
  min-width: 0;
}

.faction-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.faction-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.faction-description {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.faction-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.stat-item .el-icon {
  font-size: 14px;
}

.faction-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.faction-card:hover .faction-actions {
  opacity: 1;
}
</style>
