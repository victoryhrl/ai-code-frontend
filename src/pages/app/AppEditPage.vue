<template>
  <div id="appEditPage">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="background-gradient"></div>
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
    
    <!-- 鼠标跟随效果 -->
    <div class="mouse-follower"></div>
    
    <div class="container">
      <div class="page-header">
        <h1>编辑应用信息</h1>
      </div>

      <div class="edit-container">
        <a-card title="基本信息" :loading="loading" class="custom-card">
          <a-form
            :model="formData"
            :rules="rules"
            layout="vertical"
            @finish="handleSubmit"
            ref="formRef"
          >
            <a-form-item label="应用名称" name="appName">
              <a-input
                v-model:value="formData.appName"
                placeholder="请输入应用名称"
                :maxlength="50"
                show-count
                class="custom-input"
              />
            </a-form-item>

            <a-form-item
              v-if="isAdmin"
              label="应用封面"
              name="cover"
              extra="支持图片链接，建议尺寸：400x300"
            >
              <a-input v-model:value="formData.cover" placeholder="请输入封面图片链接" class="custom-input" />
              <div v-if="formData.cover" class="cover-preview">
                <a-image
                  :src="formData.cover"
                  :width="200"
                  :height="150"
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                  :preview="false"
                />
              </div>
            </a-form-item>

            <a-form-item v-if="isAdmin" label="优先级" name="priority" extra="设置为99表示精选应用">
              <a-input-number
                v-model:value="formData.priority"
                :min="0"
                :max="99"
                style="width: 200px"
                class="custom-input-number"
              />
            </a-form-item>

            <a-form-item label="初始提示词" name="initPrompt">
              <a-textarea
                v-model:value="formData.initPrompt"
                placeholder="请输入初始提示词"
                :rows="4"
                :maxlength="1000"
                show-count
                disabled
                class="custom-textarea"
              />
              <div class="form-tip">初始提示词不可修改</div>
            </a-form-item>

            <a-form-item label="生成类型" name="codeGenType">
              <a-input
                :value="formatCodeGenType(formData.codeGenType)"
                placeholder="生成类型"
                disabled
                class="custom-input"
              />
              <div class="form-tip">生成类型不可修改</div>
            </a-form-item>

            <a-form-item v-if="formData.deployKey" label="部署密钥" name="deployKey">
              <a-input v-model:value="formData.deployKey" placeholder="部署密钥" disabled class="custom-input" />
              <div class="form-tip">部署密钥不可修改</div>
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button type="primary" html-type="submit" :loading="submitting" class="custom-button primary-button">
              保存修改
            </a-button>
            <a-button @click="resetForm" class="custom-button default-button">重置</a-button>
            <a-button type="link" @click="goToChat" class="custom-button link-button">进入对话</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>

        <!-- 应用信息展示 -->
        <a-card title="应用信息" class="custom-card" style="margin-top: 24px">
          <a-descriptions :column="2" bordered class="custom-descriptions">
            <a-descriptions-item label="应用ID">
              {{ appInfo?.id }}
            </a-descriptions-item>
            <a-descriptions-item label="创建者">
              <UserInfo :user="appInfo?.user" size="small" />
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatTime(appInfo?.createTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="更新时间">
              {{ formatTime(appInfo?.updateTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="部署时间">
              {{ appInfo?.deployedTime ? formatTime(appInfo.deployedTime) : '未部署' }}
            </a-descriptions-item>
            <a-descriptions-item label="访问链接">
              <a-button v-if="appInfo?.deployKey" type="link" @click="openPreview" size="small" class="custom-button link-button small-button">
                查看预览
              </a-button>
              <span v-else>未部署</span>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { getAppVoById, updateApp, updateAppByAdmin } from '@/api/appController'
import { formatCodeGenType } from '@/utils/codeGenTypes'
import { formatTime } from '@/utils/time'
import UserInfo from '@/components/UserInfo.vue'
import { getStaticPreviewUrl } from '@/config/env'
import type { FormInstance } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 应用信息
const appInfo = ref<API.AppVO>()
const loading = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive({
  appName: '',
  cover: '',
  priority: 0,
  initPrompt: '',
  codeGenType: '',
  deployKey: '',
})

// 是否为管理员
const isAdmin = computed(() => {
  return loginUserStore.loginUser.userRole === 'admin'
})

// 表单验证规则
const rules = {
  appName: [
    { required: true, message: '请输入应用名称', trigger: 'blur' },
    { min: 1, max: 50, message: '应用名称长度在1-50个字符', trigger: 'blur' },
  ],
  cover: [{ type: 'url', message: '请输入有效的URL', trigger: 'blur' }],
  priority: [{ type: 'number', min: 0, max: 99, message: '优先级范围0-99', trigger: 'blur' }],
}

// 获取应用信息
const fetchAppInfo = async () => {
  const id = route.params.id as string
  if (!id) {
    message.error('应用ID不存在')
    router.push('/')
    return
  }

  loading.value = true
  try {
    const res = await getAppVoById({ id: id as unknown as number })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data

      // 检查权限
      if (!isAdmin.value && appInfo.value.userId !== loginUserStore.loginUser.id) {
        message.error('您没有权限编辑此应用')
        router.push('/')
        return
      }

      // 填充表单数据
      formData.appName = appInfo.value.appName || ''
      formData.cover = appInfo.value.cover || ''
      formData.priority = appInfo.value.priority || 0
      formData.initPrompt = appInfo.value.initPrompt || ''
      formData.codeGenType = appInfo.value.codeGenType || ''
      formData.deployKey = appInfo.value.deployKey || ''
    } else {
      message.error('获取应用信息失败')
      router.push('/')
    }
  } catch (error) {
    console.error('获取应用信息失败：', error)
    message.error('获取应用信息失败')
    router.push('/')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!appInfo.value?.id) return

  submitting.value = true
  try {
    let res
    if (isAdmin.value) {
      // 管理员可以修改更多字段
      res = await updateAppByAdmin({
        id: appInfo.value.id,
        appName: formData.appName,
        cover: formData.cover,
        priority: formData.priority,
      })
    } else {
      // 普通用户只能修改应用名称
      res = await updateApp({
        id: appInfo.value.id,
        appName: formData.appName,
      })
    }

    if (res.data.code === 0) {
      message.success('修改成功')
      // 重新获取应用信息
      await fetchAppInfo()
    } else {
      message.error('修改失败：' + res.data.message)
    }
  } catch (error) {
    console.error('修改失败：', error)
    message.error('修改失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (appInfo.value) {
    formData.appName = appInfo.value.appName || ''
    formData.cover = appInfo.value.cover || ''
    formData.priority = appInfo.value.priority || 0
  }
  formRef.value?.clearValidate()
}

// 进入对话页面
const goToChat = () => {
  if (appInfo.value?.id) {
    router.push(`/app/chat/${appInfo.value.id}`)
  }
}

// 打开预览
const openPreview = () => {
  if (appInfo.value?.codeGenType && appInfo.value?.id) {
    const url = getStaticPreviewUrl(appInfo.value.codeGenType, String(appInfo.value.id))
    window.open(url, '_blank')
  }
}

// 页面加载时获取应用信息
onMounted(() => {
  fetchAppInfo()
})
</script>

<style scoped>
/* 全局样式 */
#appEditPage {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #1e293b;
  position: relative;
  overflow: hidden;
  padding: 24px 0;
}

/* 背景装饰 */
.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
              radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.15) 0%, transparent 40%);
  z-index: -1;
}

.background-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
  transition: all 0.3s ease;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  top: -100px;
  right: -100px;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  bottom: -100px;
  left: -100px;
}

.shape-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 鼠标跟随效果 */
.mouse-follower {
  position: fixed;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 70%);
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s, opacity 0.3s;
  mix-blend-mode: overlay;
}

/* 容器 */
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

/* 编辑容器 */
.edit-container {
  width: 100%;
}

/* 自定义卡片样式 */
.custom-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background-color: white;
  overflow: hidden;
}

/* 覆盖Ant Design的卡片头部样式 */
:deep(.ant-card-head) {
  background: white;
  border-bottom: 1px solid #f1f5f9;
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
}

:deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

/* 覆盖Ant Design的卡片内容样式 */
:deep(.ant-card-body) {
  padding: 24px;
}

/* 输入框样式 */
.custom-input, .custom-textarea, .custom-input-number {
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  font-size: 16px !important;
  transition: all 0.3s ease !important;
}

.custom-input:focus, .custom-textarea:focus, .custom-input-number:focus-within {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* 封面预览 */
.cover-preview {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  display: inline-block;
}

.cover-preview :deep(.ant-image) {
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.cover-preview :deep(.ant-image):hover {
  transform: scale(1.02);
}

/* 表单提示 */
.form-tip {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 按钮样式 */
.primary-button {
  border-radius: 12px !important;
  font-weight: 600 !important;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
  border: none !important;
  padding: 6px 20px !important;
  transition: all 0.3s ease !important;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px -8px rgba(59, 130, 246, 0.3) !important;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%) !important;
}

.default-button {
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  padding: 6px 20px !important;
  transition: all 0.3s ease !important;
}

.default-button:hover {
  border-color: #3b82f6 !important;
  color: #3b82f6 !important;
}

.link-button {
  color: #3b82f6 !important;
}

.link-button:hover {
  color: #2563eb !important;
  text-decoration: underline !important;
}

/* 描述列表样式 */
.custom-descriptions {
  border-radius: 12px !important;
  overflow: hidden !important;
}

:deep(.ant-descriptions-item-label) {
  background: #f8fafc !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  color: #64748b !important;
}

:deep(.ant-descriptions-item-content) {
  font-size: 14px !important;
  color: #1e293b !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 24px;
  }
  
  .custom-descriptions {
    :deep(.ant-descriptions-row) {
      :deep(.ant-descriptions-item-label),
      :deep(.ant-descriptions-item-content) {
        display: block !important;
        width: 100% !important;
        border-right: none !important;
      }
    }
  }
}
</style>
