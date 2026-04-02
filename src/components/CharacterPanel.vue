<template>
  <div class="character-panel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>👥 人物角色</span>
          <div class="character-actions">
            <el-button size="small" type="primary" @click="addCharacter">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
            <el-button size="small" type="success" @click="showBatchGenerateDialog">
              🤖 AI批量生成
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="characters-list">
        <div v-for="character in characters" :key="character.id" class="character-item">
          <div class="character-content" @click="selectCharacter(character)">
            <div class="character-avatar">
              <img v-if="character.avatar" :src="character.avatar" />
              <div v-else class="default-avatar">{{ character.name?.charAt(0) || '？' }}</div>
            </div>
            <div class="character-info">
              <h4>{{ character.name }}</h4>
              <div class="character-meta">
                <el-tag :type="getRoleType(character.role)" size="small">{{ getRoleText(character.role) }}</el-tag>
                <el-tag v-if="character.gender" type="info" size="small">{{ getGenderText(character.gender) }}</el-tag>
                <el-tag v-if="character.race" size="small">{{ character.race }}</el-tag>
              </div>
              <p class="character-desc">{{ character.description?.length > 50 ? character.description.substring(0, 50) + '...' : character.description }}</p>
            </div>
          </div>
          <div class="character-actions">
            <el-dropdown @command="(cmd) => handleCharacterAction(cmd, character)">
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
        
        <div v-if="characters.length === 0" class="empty-state">
          <p>暂无人物角色</p>
          <el-button size="small" @click="addCharacter">创建第一个人物</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Edit, Delete, MoreFilled } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  characters: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'select-character',
  'add-character',
  'edit-character',
  'delete-character',
  'batch-generate'
])

// Methods
const selectCharacter = (character) => {
  emit('select-character', character)
}

const addCharacter = () => {
  emit('add-character')
}

const showBatchGenerateDialog = () => {
  emit('batch-generate')
}

const handleCharacterAction = (command, character) => {
  if (command === 'edit') {
    emit('edit-character', character)
  } else if (command === 'delete') {
    emit('delete-character', character)
  }
}

const getRoleType = (role) => {
  if (role === '主角') return 'primary'
  if (role === '配角') return 'success'
  if (role === '反派') return 'danger'
  return 'info'
}

const getRoleText = (role) => {
  return role || '未知角色'
}

const getGenderText = (gender) => {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return '未知'
}
</script>

<style scoped>
.character-panel {
  height: 100%;
}

.characters-list {
  max-height: 600px;
  overflow-y: auto;
}

.character-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.character-item:hover {
  background-color: #f5f7fa;
}

.character-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.character-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.character-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  font-size: 20px;
  font-weight: 600;
  color: #666;
}

.character-info {
  flex: 1;
}

.character-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.character-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.character-desc {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.character-actions {
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