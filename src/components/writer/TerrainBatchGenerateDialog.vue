<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="🏔️ AI 批量生成地形" 
    width="800px"
    :close-on-click-modal="false"
  >
    <el-form :model="generateConfig" label-width="120px" size="default">
      <el-alert 
        title="地形生成说明" 
        type="info" 
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      >
        <template #default>
          <p>AI 将生成包含完整层级关系、传记和相邻地形的详细场景设定</p>
          <p>支持村庄、城镇、城市、山脉、河流等多种地形类型</p>
        </template>
      </el-alert>

      <el-form-item label="生成数量">
        <el-input-number 
          v-model="generateConfig.count" 
          :min="1" 
          :max="10" 
          :step="1"
          style="width: 100%"
        />
        <span class="form-tip">一次生成 1-10 个地形</span>
      </el-form-item>

      <el-form-item label="地形类型">
        <el-select 
          v-model="generateConfig.terrainType" 
          placeholder="选择地形类型"
          style="width: 100%"
        >
          <el-option label="村庄" value="village" />
          <el-option label="城镇" value="town" />
          <el-option label="城市" value="city" />
          <el-option label="山脉" value="mountain" />
          <el-option label="森林" value="forest" />
          <el-option label="河流/湖泊" value="water" />
          <el-option label="平原" value="plain" />
          <el-option label="沙漠" value="desert" />
          <el-option label="岛屿" value="island" />
          <el-option label="随机混合" value="random" />
        </el-select>
      </el-form-item>

      <el-form-item label="建筑风格">
        <el-select 
          v-model="generateConfig.style" 
          placeholder="选择建筑风格"
          style="width: 100%"
        >
          <el-option label="东方风格" value="eastern">
            <span>🏮 东方风格</span>
            <span style="float: right; color: #8492a6; font-size: 12px">中式、日式、韩式等</span>
          </el-option>
          <el-option label="西方风格" value="western">
            <span>🏰 西方风格</span>
            <span style="float: right; color: #8492a6; font-size: 12px">欧式、中世纪、哥特等</span>
          </el-option>
          <el-option label="奇幻风格" value="fantasy">
            <span>🧙 奇幻风格</span>
            <span style="float: right; color: #8492a6; font-size: 12px">魔法世界、异世界等</span>
          </el-option>
          <el-option label="科幻风格" value="sci-fi">
            <span>🚀 科幻风格</span>
            <span style="float: right; color: #8492a6; font-size: 12px">未来科技、赛博朋克等</span>
          </el-option>
          <el-option label="随机混合" value="random">
            <span>🎲 随机混合</span>
            <span style="float: right; color: #8492a6; font-size: 12px">多种风格混合</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="地形规模">
        <el-select 
          v-model="generateConfig.scale" 
          placeholder="选择规模"
          style="width: 100%"
        >
          <el-option label="小型" value="small" description="小村庄、小山丘等" />
          <el-option label="中型" value="medium" description="城镇、中等山脉等" />
          <el-option label="大型" value="large" description="大城市、大型山脉等" />
          <el-option label="超大型" value="huge" description="巨型都市、山脉群等" />
        </el-select>
      </el-form-item>

      <el-form-item label="特殊要求">
        <el-input
          v-model="generateConfig.customRequirement"
          type="textarea"
          :rows="3"
          placeholder="例如：这个村庄以盛产丝绸闻名，周围被樱花树环绕，每年春天举办樱花节..."
          clearable
        />
      </el-form-item>

      <el-form-item label="包含详细信息">
        <el-checkbox-group v-model="generateConfig.includeDetails">
          <el-checkbox label="hierarchy">层级关系</el-checkbox>
          <el-checkbox label="biography">传记历史</el-checkbox>
          <el-checkbox label="economy">经济产业</el-checkbox>
          <el-checkbox label="culture">文化特色</el-checkbox>
          <el-checkbox label="neighbors">相邻地形</el-checkbox>
          <el-checkbox label="landmarks">地标建筑</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleGenerate" :loading="isGenerating">
        <el-icon v-if="isGenerating"><Loading /></el-icon>
        {{ isGenerating ? '生成中...' : '开始生成' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'generate'])

const dialogVisible = ref(props.modelValue)
const isGenerating = ref(false)

const generateConfig = reactive({
  count: 1,
  terrainType: 'village',
  style: 'eastern',
  scale: 'medium',
  customRequirement: '',
  includeDetails: ['hierarchy', 'biography', 'neighbors', 'economy', 'culture', 'landmarks']
})

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleGenerate = async () => {
  isGenerating.value = true
  try {
    emit('generate', { ...generateConfig })
    dialogVisible.value = false
    ElMessage.success('地形生成任务已提交')
  } catch (error) {
    ElMessage.error('生成失败：' + error.message)
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: block;
}

:deep(.el-checkbox-group) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
</style>
