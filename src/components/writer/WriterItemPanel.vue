<template>
  <div class="item-panel">
    <div class="panel-header">
      <h3>🎒 物品管理</h3>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="$emit('add-item')">
          <el-icon><Plus /></el-icon>
          新增物品
        </el-button>
        <el-button type="success" size="small" @click="$emit('batch-generate')">
          <el-icon><MagicStick /></el-icon>
          AI 批量生成
        </el-button>
      </div>
    </div>

    <div class="item-list">
      <div v-if="items.length === 0" class="empty-state">
        <el-empty description="暂无物品数据">
        </el-empty>
      </div>

      <div v-else class="item-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="item-card"
          @click="$emit('edit-item', item)"
        >
          <div class="item-avatar">
            <div class="default-avatar" :class="`level-${item.level}`">
              {{ item.name?.charAt(0) || '？' }}
            </div>
            <div class="item-level-badge" :class="`level-${item.level}`">
              Lv.{{ item.level }}
            </div>
          </div>

          <div class="item-info">
            <h4 class="item-name">{{ item.name }}</h4>
            <div class="item-meta">
              <el-tag v-if="item.type" size="small" type="primary">{{ item.type }}</el-tag>
              <el-tag v-if="item.style" size="small" :type="getStyleType(item.style)">
                {{ getStyleText(item.style) }}
              </el-tag>
            </div>
            <p class="item-description">{{ item.description || '暂无描述' }}</p>

            <div class="item-attributes" v-if="item.attributes && Object.keys(item.attributes).length > 0">
              <div class="attribute-item" v-for="(value, key) in item.attributes" :key="key">
                <span class="attr-name">{{ key }}:</span>
                <span class="attr-value">{{ value }}</span>
              </div>
            </div>

            <div class="item-biography" v-if="item.level === 5 && item.biography">
              <el-icon><Document /></el-icon>
              <span>有传记</span>
            </div>
          </div>

          <div class="item-actions">
            <el-dropdown @command="(cmd) => $emit('item-action', cmd, item)">
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
import { Plus, MagicStick, Document, MoreFilled, Edit, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add-item', 'edit-item', 'item-action', 'batch-generate'])

const getStyleType = (style) => {
  const styleMap = {
    'eastern': 'warning',
    'western': 'success',
    'fantasy': 'danger',
    'sci-fi': 'info',
    'mixed': 'primary'
  }
  return styleMap[style] || 'info'
}

const getStyleText = (style) => {
  const styleMap = {
    'eastern': '东方',
    'western': '西方',
    'fantasy': '奇幻',
    'sci-fi': '科幻',
    'mixed': '混合'
  }
  return styleMap[style] || '未知'
}
</script>

<style scoped>
.item-panel {
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

.item-list {
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

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  width: 100%;
}

.item-card {
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

.item-card:hover {
  background: #fff;
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.item-avatar {
  position: relative;
  flex-shrink: 0;
  width: 70px;
  height: 70px;
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  font-weight: bold;
  border-radius: 8px;
}

.default-avatar.level-1 {
  background: linear-gradient(135deg, #a8a8a8 0%, #d4d4d4 100%);
}

.default-avatar.level-2 {
  background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
}

.default-avatar.level-3 {
  background: linear-gradient(135deg, #2196f3 0%, #42a5f5 100%);
}

.default-avatar.level-4 {
  background: linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%);
}

.default-avatar.level-5 {
  background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 0 5px #ff9800, 0 0 10px #ff9800;
  }
  to {
    box-shadow: 0 0 10px #ffc107, 0 0 20px #ffc107;
  }
}

.item-level-badge {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
}

.item-level-badge.level-1 {
  background: #a8a8a8;
}

.item-level-badge.level-2 {
  background: #4caf50;
}

.item-level-badge.level-3 {
  background: #2196f3;
}

.item-level-badge.level-4 {
  background: #9c27b0;
}

.item-level-badge.level-5 {
  background: #ff9800;
  animation: glow 2s ease-in-out infinite alternate;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.item-description {
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

.item-attributes {
  margin-bottom: 12px;
  padding: 8px;
  background: #f0f2f5;
  border-radius: 4px;
}

.attribute-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.attribute-item:last-child {
  margin-bottom: 0;
}

.attr-name {
  color: #909399;
  font-weight: 500;
}

.attr-value {
  color: #409eff;
  font-weight: 600;
}

.item-biography {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ff9800;
  font-weight: 500;
}

.item-biography .el-icon {
  font-size: 14px;
}

.item-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.item-card:hover .item-actions {
  opacity: 1;
}
</style>
