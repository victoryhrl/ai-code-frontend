<template>
  <div id="teamAppChatPage">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="background-gradient"></div>
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
    
    <!-- 顶部栏 -->
    <div class="header-bar">
      <div class="header-left">
        <a-button type="text" @click="goBack" class="back-btn">
          <ArrowLeftOutlined />
        </a-button>
        <div class="app-info">
          <h1 class="app-name">{{ appInfo?.appName || '加载中...' }}</h1>
          <a-tag color="purple" class="team-tag">团队应用</a-tag>
        </div>
      </div>
      
      <!-- 在线用户列表 -->
      <div class="header-center">
        <div class="online-users" v-if="onlineUsers.length > 0">
          <span class="online-label">在线成员 ({{ onlineUsers.length }}):</span>
          <a-avatar-group :max-count="5" :max-style="{ color: '#f56a00', backgroundColor: '#fde3cf' }">
            <a-tooltip 
              v-for="user in onlineUsers" 
              :key="user.id" 
              :title="user.userName + (lockHolderId === user.id ? ' (正在编辑)' : '')"
            >
              <a-avatar 
                :src="user.userAvatar" 
                :class="{ 'avatar-speaking': lockHolderId === user.id }"
              >
                {{ user.userName?.charAt(0)?.toUpperCase() }}
              </a-avatar>
            </a-tooltip>
          </a-avatar-group>
        </div>
        <div v-else class="online-users empty">
          <span class="online-label">连接中...</span>
        </div>
      </div>

      <div class="header-right">
        <a-button
          type="primary"
          ghost
          @click="downloadCode"
          :loading="downloading"
          class="custom-button ghost-button"
        >
          <template #icon><DownloadOutlined /></template>
          下载代码
        </a-button>
        <a-button 
          v-if="canEdit"
          type="primary" 
          @click="deployApp" 
          :loading="deploying" 
          class="custom-button primary-button"
          style="margin-left: 10px;"
        >
          <template #icon><CloudUploadOutlined /></template>
          部署
        </a-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧对话区域 -->
      <div class="chat-section card-container" :class="{ 'collapsed': activeTab === 'code' }">
        <!-- 消息区域 -->
        <div class="messages-container" ref="messagesContainer">
          <div v-if="hasMoreHistory" class="load-more-container">
            <a-button type="link" @click="loadMoreHistory" :loading="loadingHistory" size="small">
              加载更多历史消息
            </a-button>
          </div>
          
          <div v-for="(message, index) in messages" :key="index" class="message-item">
            <!-- 用户消息：头像在右 -->
            <div v-if="message.type === 'user'" class="user-message">
              <div class="message-content">{{ message.content }}</div>
              <div class="message-avatar">
                <a-avatar :src="loginUserStore.loginUser.userAvatar" />
              </div>
            </div>
            <!-- AI消息：头像在左 -->
            <div v-else class="ai-message">
              <div class="message-avatar">
                <a-avatar :src="aiAvatar" />
              </div>
              <div class="message-content">
                <MarkdownRenderer v-if="message.content" :content="message.content" />
                <div v-if="message.loading" class="loading-indicator">
                  <a-spin size="small" />
                  <span>AI 正在思考...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 选中元素提示 -->
        <a-alert
          v-if="selectedElementInfo"
          class="selected-element-alert"
          type="info"
          closable
          @close="clearSelectedElement"
        >
          <template #message>
            <div class="selected-element-info">
              <span>选中元素：<code class="element-code">{{ selectedElementInfo.tagName }}</code></span>
              <span class="element-desc">将针对此元素进行修改</span>
            </div>
          </template>
        </a-alert>

        <!-- 输入区域 -->
        <div class="input-container">
          <div class="input-wrapper">
            <!-- 状态遮罩层 -->
            <div v-if="inputBlockReason" class="input-block-overlay">
              <div class="block-content">
                <template v-if="inputBlockReason === 'viewer'">
                  <EyeOutlined style="font-size: 24px; margin-bottom: 8px;" />
                  <span>您当前为浏览者模式，仅可查看</span>
                </template>
                <template v-else-if="inputBlockReason === 'locked'">
                  <LockOutlined style="font-size: 24px; margin-bottom: 8px;" />
                  <span>{{ lockHolderName }} 正在修改应用，请稍候...</span>
                </template>
              </div>
            </div>

            <div class="input-tools">
              <a-switch 
                v-model:checked="isDeepThinking" 
                checked-children="深度思考"
                un-checked-children="快速回复"
                :disabled="isGenerating || !canEdit"
                size="small"
              />
            </div>
            
            <a-textarea
              v-model:value="userInput"
              :placeholder="canEdit ? '描述需求，与团队共同构建应用...' : '无编辑权限'"
              :rows="4"
              :maxlength="1000"
              @keydown.enter.prevent="sendMessage"
              :disabled="!!inputBlockReason || isGenerating"
            />
            
            <div class="input-actions">
              <a-button
                type="primary"
                @click="sendMessage"
                :loading="isGenerating"
                :disabled="!!inputBlockReason"
              >
                <template #icon><SendOutlined /></template>
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧预览/代码区域 -->
      <div class="preview-section card-container" :class="{ 'expanded': activeTab === 'code' }">
        <div class="preview-header">
          <div class="header-tabs">
            <div 
              class="tab-item" 
              :class="{ active: activeTab === 'preview' }"
              @click="handleTabChange('preview')"
            >
              <EyeOutlined /> 预览模式
            </div>
            <div 
              class="tab-item" 
              :class="{ active: activeTab === 'code' }"
              @click="handleTabChange('code')"
            >
              <CodeOutlined /> 代码编辑
            </div>
          </div>

          <div class="preview-actions">
            <template v-if="activeTab === 'code'">
               <a-button 
                 v-if="canEdit"
                 type="primary" 
                 size="small" 
                 @click="saveAndRunCode" 
                 :loading="isSaving"
                 :disabled="!currentFilePath || !!inputBlockReason"
               >
                <template #icon><SaveOutlined /></template>
                保存并运行
              </a-button>
            </template>
            <template v-else>
              <a-button
                v-if="canEdit && previewUrl"
                type="link"
                :danger="isEditMode"
                @click="toggleEditMode"
                :class="{ 'edit-mode-active': isEditMode }"
                :disabled="!!inputBlockReason"
              >
                <template #icon><EditOutlined /></template>
                {{ isEditMode ? '退出编辑' : '可视化编辑' }}
              </a-button>
              <a-button v-if="previewUrl" type="link" @click="openInNewTab">
                <template #icon><ExportOutlined /></template>
                新窗口
              </a-button>
            </template>
          </div>
        </div>

        <div class="preview-content">
          <!-- 预览模式 -->
          <div v-show="activeTab === 'preview'" class="preview-iframe-container">
            <div v-if="!previewUrl && !isGenerating" class="preview-placeholder">
              <div class="placeholder-icon">🌐</div>
              <p>应用生成后将在此展示</p>
            </div>
            <div v-else-if="isGenerating" class="preview-loading">
              <a-spin size="large" />
              <p>{{ lockHolderName ? `${lockHolderName} 正在生成...` : '正在生成...' }}</p>
            </div>
            <iframe
              v-else
              :src="previewUrl"
              class="preview-iframe"
              frameborder="0"
              @load="onIframeLoad"
            ></iframe>
          </div>

          <!-- 代码编辑模式 -->
          <div v-show="activeTab === 'code'" class="code-editor-container">
            <div class="file-tree-sidebar">
              <a-directory-tree
                v-if="fileTreeData.length"
                v-model:expandedKeys="expandedKeys"
                v-model:selectedKeys="selectedKeys"
                :tree-data="fileTreeData"
                @select="onSelectFile"
              />
            </div>
            <div class="code-editor-main">
              <VueMonacoEditor
                v-if="currentFilePath"
                v-model:value="currentCode"
                theme="vs-light" 
                :options="{
                  automaticLayout: true,
                  readOnly: !!inputBlockReason || isGenerating || isSaving
                }"
                :language="editorLanguage" 
                height="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 部署成功弹窗 -->
    <DeploySuccessModal
      v-model:open="deployModalVisible"
      :deploy-url="deployUrl"
      @open-site="openDeployedSite"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { getAppVoById, getFileTree, getAppCodeContent, updateAppCode, deployApp as deployAppApi } from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import { getTeamUser } from '@/api/teamUserController'
import { CodeGenTypeEnum } from '@/utils/codeGenTypes'
import { getStaticPreviewUrl, API_BASE_URL, WS_BASE_URL } from '@/config/env'
import { VisualEditor, type ElementInfo } from '@/utils/visualEditor'
import request from '@/request'
import aiAvatar from '@/assets/aiAvatar.png'

// 组件引入
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import DeploySuccessModal from '@/components/DeploySuccessModal.vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import {
  ArrowLeftOutlined, DownloadOutlined, CloudUploadOutlined, SendOutlined,
  EyeOutlined, CodeOutlined, EditOutlined, ExportOutlined, SaveOutlined,
  LockOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 路由参数 - 直接获取字符串或 Number，但不强制 Number() 转换
const teamId = computed(() => route.params.teamId)
const appId = computed(() => route.params.appId)

// 状态定义
const appInfo = ref<API.AppVO>()
const teamRole = ref<string>('') // viewer, editor, admin
const onlineUsers = ref<API.UserVO[]>([])
const lockHolderId = ref<number | null>(null)

// 聊天相关
const messages = ref<any[]>([])
const userInput = ref('')
const isGenerating = ref(false)
const isDeepThinking = ref(false)
const messagesContainer = ref<HTMLElement>()

// WebSocket
let socket: WebSocket | null = null
let heartbeatInterval: any = null

// UI 状态
const activeTab = ref<'preview' | 'code'>('preview')
const loadingHistory = ref(false)
const hasMoreHistory = ref(false)
const lastCreateTime = ref<string>() // 游标
const previewUrl = ref('')
const deploying = ref(false)
const downloading = ref(false)
const deployModalVisible = ref(false)
const deployUrl = ref('')

// 编辑器状态
const fileTreeData = ref<any[]>([])
const currentCode = ref('')
const currentFilePath = ref('')
const expandedKeys = ref<string[]>([])
const selectedKeys = ref<string[]>([])
const isSaving = ref(false)

// 权限计算
const canEdit = computed(() => ['admin', 'editor'].includes(teamRole.value))
const isLockedByOther = computed(() => lockHolderId.value !== null && lockHolderId.value !== loginUserStore.loginUser.id)
const lockHolderName = computed(() => {
  if (!lockHolderId.value) return ''
  const user = onlineUsers.value.find(u => u.id === lockHolderId.value)
  return user ? user.userName : '其他成员'
})

// 输入框锁定原因
const inputBlockReason = computed(() => {
  if (!canEdit.value) return 'viewer'
  if (isLockedByOther.value) return 'locked'
  return null
})

// 可视化编辑
const isEditMode = ref(false)
const selectedElementInfo = ref<ElementInfo | null>(null)
const visualEditor = new VisualEditor({
  onElementSelected: (info) => selectedElementInfo.value = info
})

// --- 初始化逻辑 ---
onMounted(async () => {
  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    router.push('/user/login')
    return
  }
  
  // 这里的 id 传递直接使用 .value，不需要 Number()
  await Promise.all([
    fetchAppInfo(),
    fetchTeamRole(),
    loadChatHistory()
  ])
  
  connectWebSocket()
  
  // 监听 iframe 消息
  window.addEventListener('message', visualEditor.handleIframeMessage)
})

onUnmounted(() => {
  if (socket) {
    socket.close()
  }
  if (heartbeatInterval) clearInterval(heartbeatInterval)
  window.removeEventListener('message', visualEditor.handleIframeMessage)
})

// --- 业务逻辑 ---

// 1. 获取角色权限
const fetchTeamRole = async () => {
  try {
    // 移除 Number 转换，直接传参
    const res = await getTeamUser({
      teamId: teamId.value,
      userId: loginUserStore.loginUser.id
    })
    if (res.data.code === 0 && res.data.data) {
      teamRole.value = res.data.data.teamRole
    }
  } catch (error) {
    console.error('获取团队角色失败', error)
  }
}

// 2. WebSocket 连接
const connectWebSocket = () => {
  // 使用配置中的 WS_BASE_URL，如果未配置，尝试自动推断
  let wsUrl = WS_BASE_URL
  if (!wsUrl) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // 假设后端 ws 路径在根目录 /ws
    wsUrl = `${protocol}//${window.location.host}/ws`
  }
  
  // 移除尾部斜杠，防止双斜杠
  wsUrl = wsUrl.endsWith('/') ? wsUrl.slice(0, -1) : wsUrl
  
  // 完整 URL: ws://host/ws/team/app/{appId}
  const fullUrl = `${wsUrl}/team/app/${appId.value}`
  
  console.log('Connecting to WebSocket:', fullUrl)
  
  socket = new WebSocket(fullUrl)
  
  socket.onopen = () => {
    console.log('Team Chat WebSocket Connected')
    startHeartbeat()
  }
  
  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      // 增加调试日志，查看接收到的数据
      console.log('WS Message Received:', msg)
      handleWsMessage(msg)
    } catch (e) {
      console.error('WS消息解析失败', e)
    }
  }
  
  socket.onclose = () => {
    console.log('WebSocket Disconnected')
  }
  
  socket.onerror = (err) => {
    console.error('WebSocket Error', err)
  }
}

const handleWsMessage = (msg: any) => {
  switch (msg.type) {
    case 'INIT_STATE':
    case 'LOCK_UPDATE':
      lockHolderId.value = msg.data.holderId === -1 ? null : msg.data.holderId
      break
    case 'ONLINE_UPDATE':
      // 确保赋值给 onlineUsers
      if (Array.isArray(msg.data)) {
        onlineUsers.value = msg.data
      }
      break
  }
}

const startHeartbeat = () => {
  heartbeatInterval = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      // 发送简单的文本或者 json 作为心跳
      // socket.send('PING') 
      // 有些后端框架需要特定格式，这里视情况而定
    }
  }, 30000)
}

// 3. 发送消息 (团队专用接口)
const sendMessage = async () => {
  if (!userInput.value.trim() || inputBlockReason.value) return
  
  const prompt = userInput.value.trim()
  userInput.value = '' // 立即清空
  
  messages.value.push({ type: 'user', content: prompt })
  const aiIndex = messages.value.push({ type: 'ai', content: '', loading: true }) - 1
  scrollToBottom()
  
  isGenerating.value = true
  
  try {
    const baseURL = request.defaults.baseURL || API_BASE_URL
    // 构建参数，直接传值
    const params = new URLSearchParams({
      appId: String(appId.value),
      teamId: String(teamId.value),
      message: prompt,
      isDeep: isDeepThinking.value ? 'true' : 'false'
    })
    
    const eventSource = new EventSource(`${baseURL}/team/app/chat/gen/code?${params}`, {
      withCredentials: true
    })
    
    let fullContent = ''
    
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.d) {
        fullContent += data.d
        messages.value[aiIndex].content = fullContent
        messages.value[aiIndex].loading = false
        scrollToBottom()
      }
    }
    
    eventSource.addEventListener('done', () => {
      isGenerating.value = false
      eventSource.close()
      updatePreview() 
      if (activeTab.value === 'code') loadFileTree() 
    })
    
    eventSource.onerror = (e) => {
      isGenerating.value = false
      eventSource.close()
      if (fullContent.length === 0) {
        messages.value[aiIndex].content = '生成出错或连接中断，请重试。'
      }
    }
    
  } catch (error) {
    isGenerating.value = false
    messages.value[aiIndex].content = '发送请求失败'
  }
}

// --- 基础功能 (复用逻辑) ---
const fetchAppInfo = async () => {
  // 移除 Number
  const res = await getAppVoById({ id: appId.value })
  if (res.data.code === 0) {
    appInfo.value = res.data.data
    updatePreview()
  }
}

// 加载对话历史 (支持分页)
const loadChatHistory = async (isLoadMore = false) => {
  if (!appId.value || loadingHistory.value) return
  loadingHistory.value = true
  try {
    const params: any = {
      appId: appId.value, // 移除 Number
      pageSize: 20,
    }
    if (isLoadMore && lastCreateTime.value) {
      params.lastCreateTime = lastCreateTime.value
    }
    const res = await listAppChatHistory(params)
    if (res.data.code === 0 && res.data.data?.records) {
      const records = res.data.data.records
      const newMessages = records.map((chat: any) => ({
        type: chat.messageType === 'user' ? 'user' : 'ai',
        content: chat.message || '',
        createTime: chat.createTime
      }))
      
      // 按时间正序排列：旧的消息在前，新的在后
      newMessages.sort((a: any, b: any) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())

      if (isLoadMore) {
        messages.value.unshift(...newMessages)
      } else {
        messages.value = newMessages
        setTimeout(scrollToBottom, 100)
      }
      
      // 如果加载更多，游标应该是时间最早的那条
      // records 本身通常是按时间倒序返回的，所以最后一条是最早的
      if (records.length > 0) {
        // 假设后端返回的是按时间倒序的（最新的在 index 0）
        // 那么最早的一条就是 records[records.length - 1]
        lastCreateTime.value = records[records.length - 1].createTime
      }
      hasMoreHistory.value = records.length === 20
    } else {
      hasMoreHistory.value = false
    }
  } catch (error) {
    console.error('加载历史消息失败', error)
    message.error('加载历史消息失败')
  } finally {
    loadingHistory.value = false
  }
}

const loadMoreHistory = async () => {
  await loadChatHistory(true)
}

const updatePreview = () => {
  if (appId.value) {
    const type = appInfo.value?.codeGenType || CodeGenTypeEnum.HTML
    previewUrl.value = getStaticPreviewUrl(type, appId.value) + `?t=${Date.now()}`
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const goBack = () => router.push(`/team/detail/${teamId.value}`)

// 代码编辑相关逻辑
const loadFileTree = async () => {
  const res = await getFileTree({ appId: appId.value })
  if (res.data.code === 0) fileTreeData.value = res.data.data
}

const onSelectFile = async (keys: any, info: any) => {
  if (!info.node.isLeaf) return
  currentFilePath.value = keys[0]
  const res = await getAppCodeContent({ appId: appId.value, filePath: keys[0] })
  if (res.data.code === 0) currentCode.value = res.data.data
}

const saveAndRunCode = async () => {
  isSaving.value = true
  try {
    await updateAppCode({ appId: appId.value, filePath: currentFilePath.value, content: currentCode.value })
    message.success('保存成功')
    updatePreview()
  } finally {
    isSaving.value = false
  }
}

const handleTabChange = (key: 'preview' | 'code') => {
  activeTab.value = key
  if (key === 'code' && fileTreeData.value.length === 0) loadFileTree()
}

const editorLanguage = computed(() => {
  if (!currentFilePath.value) return 'javascript'
  const ext = currentFilePath.value.split('.').pop()
  if (ext === 'html') return 'html'
  if (ext === 'css') return 'css'
  return 'javascript'
})

const onIframeLoad = () => {
  const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
  if (iframe) visualEditor.init(iframe)
}

const toggleEditMode = () => {
  isEditMode.value = visualEditor.toggleEditMode()
}
const clearSelectedElement = () => {
  selectedElementInfo.value = null
  visualEditor.clearSelection()
}
const openInNewTab = () => window.open(previewUrl.value, '_blank')
const downloadCode = () => message.info('下载功能与个人版一致') 
const deployApp = async () => {
  deploying.value = true
  try {
    const res = await deployAppApi({ appId: appId.value })
    if (res.data.code === 0) {
      deployUrl.value = res.data.data
      deployModalVisible.value = true
    }
  } finally {
    deploying.value = false
  }
}
const openDeployedSite = () => window.open(deployUrl.value, '_blank')

</script>

<style scoped>
#teamAppChatPage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: #f8fafc;
  overflow: hidden;
}

/* 顶部栏调整 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  color: #64748b;
}

.app-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.team-tag {
  margin-top: 12px;
  font-size: 12px;
}

/* 在线用户列表 */
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.online-users {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: #f8fafc;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.online-users.empty {
  color: #999;
}

.online-label {
  font-size: 12px;
  color: #64748b;
}

/* 正在说话的头像动效 */
.avatar-speaking {
  border: 2px solid #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  transform: scale(1.1);
  z-index: 10;
}

/* 布局复用 */
.main-content {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
}

.card-container {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

/* 左侧聊天区域：增加固定宽度 
  使用 flex: 0 0 450px 确保宽度固定，不随窗口伸缩变小
*/
.chat-section {
  width: 450px; 
  flex: 0 0 450px;
  position: relative;
  transition: all 0.3s ease;
}

/* 右侧预览/代码区域：占据剩余空间 
*/
.preview-section {
  flex: 1;
  overflow: hidden;
  min-width: 0; /* 防止内容撑开 */
}

/* 当代码编辑模式下，左侧收起（如果需要） */
.chat-section.collapsed {
  width: 0;
  flex: 0 0 0;
  overflow: hidden;
  padding: 0;
  border: none;
  margin: 0;
}

/* 消息区域 */
.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8fafc;
}

.message-item {
  margin-bottom: 16px;
}

.user-message {
  display: flex;
  /* flex-direction: row-reverse;  <-- Remove this */
  justify-content: flex-end;    /* <-- Add this */
  gap: 12px;
}

.user-message .message-content {
  background: #3b82f6;
  color: white;
  padding: 10px 16px;
  /* border-radius: 12px 0 12px 12px; <-- Old */
  border-radius: 12px 12px 0 12px; /* <-- New: Bubble points to right */
}

.ai-message {
  display: flex;
  gap: 12px;
}

.ai-message .message-content {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 10px 16px;
  border-radius: 0 12px 12px 12px;
}

/* 输入区域锁定遮罩 */
.input-container {
  padding: 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.input-wrapper {
  position: relative;
}

.input-block-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  border-radius: 8px;
  cursor: not-allowed;
}

.block-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #64748b;
  font-weight: 500;
}

.input-tools {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.input-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
}

/* 预览区域头部 */
.preview-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.tab-item {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
}

.tab-item.active {
  background: white;
  color: #3b82f6;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.preview-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  /* 关键修复：确保子元素 height: 100% 能生效 */
  display: flex;
  flex-direction: column; 
}

.preview-iframe-container {
  width: 100%;
  height: 100%;
  /* 确保占满 flex 容器 */
  flex: 1; 
  display: flex;
  flex-direction: column;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  flex: 1;
}

/* 代码编辑模式布局 */
.code-editor-container {
  display: flex;
  height: 100%;
  flex: 1;
}

.file-tree-sidebar {
  width: 220px;
  border-right: 1px solid #e2e8f0;
  background: #fafafa;
  overflow-y: auto;
}

.code-editor-main {
  flex: 1;
  overflow: hidden;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  margin-top: 4px;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
}

.selected-element-alert {
  margin: 0 16px 12px;
}

.element-code {
  color: #f5222d;
  background: #fff1f0;
  padding: 2px 4px;
  border-radius: 4px;
  margin: 0 4px;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .chat-section {
    width: 100%; /* 移动端占满 */
    flex: none;
    height: 50vh;
    margin-bottom: 16px;
  }

  .preview-section {
    flex: none;
    height: 50vh;
  }
}
</style>