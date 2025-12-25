<template>
  <div id="appChatPage">
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
    
    <!-- 顶部栏 -->
    <div class="header-bar">
      <div class="header-left">
        <h1 class="app-name">{{ appInfo?.appName || '网站生成器' }}</h1>
        <a-tag v-if="appInfo?.codeGenType" color="blue" class="code-gen-type-tag">
          {{ formatCodeGenType(appInfo.codeGenType) }}
        </a-tag>
      </div>
      <div class="header-right">
        <a-button type="default" @click="showAppDetail" class="custom-button">
          <template #icon>
            <InfoCircleOutlined />
          </template>
          应用详情
        </a-button>
        <a-button
          type="primary"
          ghost
          @click="downloadCode"
          :loading="downloading"
          class="custom-button ghost-button"
        >
          <template #icon>
            <DownloadOutlined />
          </template>
          下载代码
        </a-button>
        <a-button type="primary" @click="deployApp" :loading="deploying" class="custom-button primary-button">
          <template #icon>
            <CloudUploadOutlined />
          </template>
          部署
        </a-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧对话区域 (绑定 collapsed 类控制收起) -->
      <div class="chat-section card-container" :class="{ 'collapsed': activeTab === 'code' }">
        <!-- 消息区域 -->
        <div class="messages-container" ref="messagesContainer">
          <!-- 加载更多按钮 -->
          <div v-if="hasMoreHistory" class="load-more-container">
            <a-button type="link" @click="loadMoreHistory" :loading="loadingHistory" size="small">
              加载更多历史消息
            </a-button>
          </div>
          <div v-for="(message, index) in messages" :key="index" class="message-item">
            <div v-if="message.type === 'user'" class="user-message">
              <div class="message-content">{{ message.content }}</div>
              <div class="message-avatar">
                <a-avatar :src="loginUserStore.loginUser.userAvatar" />
              </div>
            </div>
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

        <!-- 选中元素信息展示 -->
        <a-alert
          v-if="selectedElementInfo"
          class="selected-element-alert"
          type="info"
          closable
          @close="clearSelectedElement"
        >
          <template #message>
            <div class="selected-element-info">
              <div class="element-header">
                <span class="element-tag">
                  选中元素：{{ selectedElementInfo.tagName.toLowerCase() }}
                </span>
                <span v-if="selectedElementInfo.id" class="element-id">
                  #{{ selectedElementInfo.id }}
                </span>
                <span v-if="selectedElementInfo.className" class="element-class">
                  .{{ selectedElementInfo.className.split(' ').join('.') }}
                </span>
              </div>
              <div class="element-details">
                <div v-if="selectedElementInfo.textContent" class="element-item">
                  内容: {{ selectedElementInfo.textContent.substring(0, 50) }}
                  {{ selectedElementInfo.textContent.length > 50 ? '...' : '' }}
                </div>
                <div v-if="selectedElementInfo.pagePath" class="element-item">
                  页面路径: {{ selectedElementInfo.pagePath }}
                </div>
                <div class="element-item">
                  选择器:
                  <code class="element-selector-code">{{ selectedElementInfo.selector }}</code>
                </div>
              </div>
            </div>
          </template>
        </a-alert>

        <!-- 用户消息输入框 -->
        <div class="input-container">
          <div class="input-wrapper">
            <!-- 深度思考功能开关 -->
            <div style="display: flex; justify-content: flex-start; margin-bottom: 8px;">
              <a-switch 
                v-model:checked="isDeepThinking" 
                checked-children="深度思考"
                un-checked-children="快速回复"
                :disabled="isGenerating || !isOwner"
              />
            </div>
            <a-textarea
              v-model:value="userInput"
              :placeholder="getInputPlaceholder()"
              :rows="4"
              :maxlength="1000"
              @keydown.enter.prevent="sendMessage"
              :disabled="isGenerating"
            />
            
            <div class="input-actions">
              <a-button
                type="primary"
                @click="sendMessage"
                :loading="isGenerating"
              >
                <template #icon>
                  <SendOutlined />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧网页/代码展示区域 (绑定 expanded 类控制展开) -->
      <div class="preview-section card-container" :class="{ 'expanded': activeTab === 'code' }">
        <div class="preview-header">
          <!-- 头部 Tab 切换 -->
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
            <!-- 代码模式下的操作按钮 -->
            <template v-if="activeTab === 'code'">
               <!-- 提示信息 -->
               <span v-if="hasUnsavedChanges(currentFilePath)" class="unsaved-tip">
                 <InfoCircleOutlined /> 已暂存(Ctrl+S)，点击右侧按钮部署
               </span>
               <a-button 
                 type="primary" 
                 size="small" 
                 @click="saveAndRunCode" 
                 :loading="isSaving"
                 :disabled="!currentFilePath"
                 class="save-code-btn"
               >
                <template #icon><SaveOutlined /></template>
                保存并运行
              </a-button>
            </template>

            <!-- 预览模式下的操作按钮 -->
            <template v-else>
              <a-button
                v-if="isOwner && previewUrl"
                type="link"
                :danger="isEditMode"
                @click="toggleEditMode"
                :class="{ 'edit-mode-active': isEditMode }"
                style="padding: 0; height: auto; margin-right: 12px"
              >
                <template #icon>
                  <EditOutlined />
                </template>
                {{ isEditMode ? '退出编辑' : '编辑模式' }}
              </a-button>
              <a-button v-if="previewUrl" type="link" @click="openInNewTab">
                <template #icon>
                  <ExportOutlined />
                </template>
                新窗口打开
              </a-button>
            </template>
          </div>
        </div>

        <div class="preview-content">
          <!-- 1. 预览模式内容 -->
          <div v-show="activeTab === 'preview'" class="preview-iframe-container">
            <div v-if="!previewUrl && !isGenerating" class="preview-placeholder">
              <div class="placeholder-icon">🌐</div>
              <p>网站文件生成完成后将在这里展示</p>
            </div>
            <div v-else-if="isGenerating" class="preview-loading">
              <a-spin size="large" />
              <p>正在生成网站...</p>
            </div>
            <iframe
              v-else
              :src="previewUrl"
              class="preview-iframe"
              frameborder="0"
              @load="onIframeLoad"
            ></iframe>
          </div>

          <!-- 2. 代码编辑模式内容 -->
          <div v-show="activeTab === 'code'" class="code-editor-container">
            <!-- 左侧文件树 -->
            <div class="file-tree-sidebar">
              <a-directory-tree
                v-if="fileTreeData.length"
                v-model:expandedKeys="expandedKeys"
                v-model:selectedKeys="selectedKeys"
                :tree-data="fileTreeData"
                @select="onSelectFile"
                :height="500" 
                :virtual="true"
              >
                <!-- 自定义树节点标题，显示未保存状态 -->
                <template #title="{ title, key }">
                  <span class="tree-node-title">
                    {{ title }}
                    <span v-if="modifiedKeys.has(key)" class="modified-indicator">*</span>
                  </span>
                </template>
              </a-directory-tree>
              <div v-else class="empty-tree">
                <a-spin v-if="isGenerating" />
                <span v-else>点击加载文件...</span>
              </div>
            </div>
            
            <!-- 右侧编辑器 -->
            <div class="code-editor-main">
              <div v-if="!currentFilePath" class="editor-placeholder">
                <FileOutlined style="font-size: 48px; margin-bottom: 16px; opacity: 0.5" />
                <p>请从左侧选择文件进行编辑</p>
              </div>
              <a-spin :spinning="isCodeLoading" wrapperClassName="editor-spin-wrapper">
                 <VueMonacoEditor
                  v-if="currentFilePath"
                  v-model:value="currentCode"
                  theme="vs-light" 
                  :options="{
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    readOnly: isGenerating || isSaving
                  }"
                  :language="editorLanguage" 
                  height="100%"
                  style="height: 100%"
                  @mount="handleEditorMount"
                />
              </a-spin>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 应用详情弹窗 -->
    <AppDetailModal
      v-model:open="appDetailVisible"
      :app="appInfo"
      :show-actions="isOwner || isAdmin"
      @edit="editApp"
      @delete="deleteApp"
    />

    <!-- 部署成功弹窗 -->
    <DeploySuccessModal
      v-model:open="deployModalVisible"
      :deploy-url="deployUrl"
      @open-site="openDeployedSite"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import {
  getAppVoById,
  deployApp as deployAppApi,
  deleteApp as deleteAppApi,
  getFileTree,
  getAppCodeContent,
  updateAppCode
} from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import { CodeGenTypeEnum, formatCodeGenType } from '@/utils/codeGenTypes'
import request from '@/request'

import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import AppDetailModal from '@/components/AppDetailModal.vue'
import DeploySuccessModal from '@/components/DeploySuccessModal.vue'
import aiAvatar from '@/assets/aiAvatar.png'
import { API_BASE_URL, getStaticPreviewUrl } from '@/config/env'
import { VisualEditor, type ElementInfo } from '@/utils/visualEditor'

// 引入 Monaco Editor 相关
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import type { DataNode } from 'ant-design-vue/es/tree'

import {
  CloudUploadOutlined,
  SendOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  CodeOutlined,
  EyeOutlined,
  SaveOutlined,
  FileOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 应用信息
const appInfo = ref<API.AppVO>()
const appId = ref<any>()

// 对话相关
interface Message {
  type: 'user' | 'ai'
  content: string
  loading?: boolean
  createTime?: string
}

const messages = ref<Message[]>([])
const userInput = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement>()
// 深度思考功能开关
const isDeepThinking = ref(false)

// 对话历史相关
const loadingHistory = ref(false)
const hasMoreHistory = ref(false)
const lastCreateTime = ref<string>()
const historyLoaded = ref(false)

// 预览相关
const previewUrl = ref('')
const previewReady = ref(false)

// 部署相关
const deploying = ref(false)
const deployModalVisible = ref(false)
const deployUrl = ref('')

// 下载相关
const downloading = ref(false)

// 可视化编辑相关
const isEditMode = ref(false)
const selectedElementInfo = ref<ElementInfo | null>(null)
const visualEditor = new VisualEditor({
  onElementSelected: (elementInfo: ElementInfo) => {
    selectedElementInfo.value = elementInfo
  },
})

// --- 代码编辑相关状态 ---
const activeTab = ref<'preview' | 'code'>('preview') // 当前标签页
const fileTreeData = ref<DataNode[]>([]) // 文件树数据
const expandedKeys = ref<string[]>([]) // 展开的节点
const selectedKeys = ref<string[]>([]) // 选中的文件
const currentCode = ref('') // 当前编辑器中的代码
const currentFilePath = ref('') // 当前编辑的文件路径
const isCodeLoading = ref(false) // 加载文件内容loading
const isSaving = ref(false) // 保存代码loading

// 新增：本地暂存（Ctrl+S）相关状态
const stagedFiles = ref<Map<string, string>>(new Map()) // 存储暂存的文件内容
const modifiedKeys = ref<Set<string>>(new Set()) // 存储有变动的文件路径（用于显示 * 号）
const originalFileContent = ref<Map<string, string>>(new Map()) // 存储文件从后端拉取的原始内容

// 计算编辑器语言
const editorLanguage = computed(() => {
  if (!currentFilePath.value) return 'javascript'
  const ext = currentFilePath.value.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'html': return 'html'
    case 'css': return 'css'
    case 'json': return 'json'
    case 'vue': return 'html' 
    case 'ts': return 'typescript'
    case 'java': return 'java'
    case 'py': return 'python'
    case 'md': return 'markdown'
    default: return 'javascript'
  }
})

// 权限相关
const isOwner = computed(() => {
  return appInfo.value?.userId === loginUserStore.loginUser.id
})

const isAdmin = computed(() => {
  return loginUserStore.loginUser.userRole === 'admin'
})

// 应用详情相关
const appDetailVisible = ref(false)

// 显示应用详情
const showAppDetail = () => {
  appDetailVisible.value = true
}

// 加载对话历史
const loadChatHistory = async (isLoadMore = false) => {
  if (!appId.value || loadingHistory.value) return
  loadingHistory.value = true
  try {
    const params: API.listAppChatHistoryParams = {
      appId: appId.value,
      pageSize: 10,
    }
    // 如果是加载更多，传递最后一条消息的创建时间作为游标
    if (isLoadMore && lastCreateTime.value) {
      params.lastCreateTime = lastCreateTime.value
    }
    const res = await listAppChatHistory(params)
    if (res.data.code === 0 && res.data.data) {
      const chatHistories = res.data.data.records || []
      if (chatHistories.length > 0) {
        // 将对话历史转换为消息格式，并按时间正序排列（老消息在前）
        const historyMessages: Message[] = chatHistories
          .map((chat) => ({
            type: (chat.messageType === 'user' ? 'user' : 'ai') as 'user' | 'ai',
            content: chat.message || '',
            createTime: chat.createTime,
          })) 
        if (isLoadMore) {
          // 加载更多时，将历史消息添加到开头
          messages.value.unshift(...historyMessages)
        } else {
          // 初始加载，直接设置消息列表
          messages.value = historyMessages
        }
        // 更新游标
        lastCreateTime.value = chatHistories[chatHistories.length - 1]?.createTime
        // 检查是否还有更多历史
        hasMoreHistory.value = chatHistories.length === 10
      } else {
        hasMoreHistory.value = false
      }
      historyLoaded.value = true
    }
  } catch (error) {
    console.error('加载对话历史失败：', error)
    message.error('加载对话历史失败')
  } finally {
    loadingHistory.value = false
  }
}

// 加载更多历史消息
const loadMoreHistory = async () => {
  await loadChatHistory(true)
}

// 获取应用信息
const fetchAppInfo = async () => {
  const id = route.params.id as string
  if (!id) {
    message.error('应用ID不存在')
    router.push('/')
    return
  }

  appId.value = id

  try {
    const res = await getAppVoById({ id: id as unknown as number })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data

      // 先加载对话历史
      await loadChatHistory()
      // 如果有至少2条对话记录，展示对应的网站
      if (messages.value.length >= 2) {
        updatePreview()
      }
      // 检查是否需要自动发送初始提示词
      if (
        appInfo.value.initPrompt &&
        isOwner.value &&
        messages.value.length === 0 &&
        historyLoaded.value
      ) {
        await sendInitialMessage(appInfo.value.initPrompt)
      }
    } else {
      message.error('获取应用信息失败')
      router.push('/')
    }
  } catch (error) {
    console.error('获取应用信息失败：', error)
    message.error('获取应用信息失败')
    router.push('/')
  }
}

// 发送初始消息
const sendInitialMessage = async (prompt: string) => {
  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: prompt,
  })

  // 添加AI消息占位符
  const aiMessageIndex = messages.value.length
  messages.value.push({
    type: 'ai',
    content: '',
    loading: true,
  })

  await nextTick()
  scrollToBottom()

  // 开始生成
  isGenerating.value = true
  await generateCode(prompt, aiMessageIndex)
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isGenerating.value) {
    return
  }

  let messageText = userInput.value.trim()
  if (selectedElementInfo.value) {
    let elementContext = `\n\n选中元素信息：`
    if (selectedElementInfo.value.pagePath) {
      elementContext += `\n- 页面路径: ${selectedElementInfo.value.pagePath}`
    }
    elementContext += `\n- 标签: ${selectedElementInfo.value.tagName.toLowerCase()}\n- 选择器: ${selectedElementInfo.value.selector}`
    if (selectedElementInfo.value.textContent) {
      elementContext += `\n- 当前内容: ${selectedElementInfo.value.textContent.substring(0, 100)}`
    }
    messageText += elementContext
  }
  userInput.value = ''
  messages.value.push({
    type: 'user',
    content: messageText,
  })

  if (selectedElementInfo.value) {
    clearSelectedElement()
    if (isEditMode.value) {
      toggleEditMode()
    }
  }

  const aiMessageIndex = messages.value.length
  messages.value.push({
    type: 'ai',
    content: '',
    loading: true,
  })

  await nextTick()
  scrollToBottom()

  isGenerating.value = true
  await generateCode(messageText, aiMessageIndex)
}

// 生成代码
const generateCode = async (userMessage: string, aiMessageIndex: number) => {
  let eventSource: EventSource | null = null
  let streamCompleted = false

  try {
    const baseURL = request.defaults.baseURL || API_BASE_URL
    const params = new URLSearchParams({
      appId: appId.value || '',
      message: userMessage,
      isDeep: isDeepThinking.value ? 'true' : 'false'
    })

    const url = `${baseURL}/app/chat/gen/code?${params}`

    eventSource = new EventSource(url, {
      withCredentials: true,
    })

    let fullContent = ''

    eventSource.onmessage = function (event) {
      if (streamCompleted) return
      try {
        const parsed = JSON.parse(event.data)
        const content = parsed.d
        if (content !== undefined && content !== null) {
          fullContent += content
          messages.value[aiMessageIndex].content = fullContent
          messages.value[aiMessageIndex].loading = false
          scrollToBottom()
        }
      } catch (error) {
        console.error('解析消息失败:', error)
        handleError(error, aiMessageIndex)
      }
    }

    eventSource.addEventListener('done', function () {
      if (streamCompleted) return
      streamCompleted = true
      isGenerating.value = false
      eventSource?.close()
      setTimeout(async () => {
        await fetchAppInfo()
        updatePreview()
        if (activeTab.value === 'code') {
          loadFileTree()
          // 生成新代码后清空本地缓存，避免冲突
          stagedFiles.value.clear()
          modifiedKeys.value.clear()
        }
      }, 1000)
    })

    eventSource.addEventListener('business-error', function (event: MessageEvent) {
      if (streamCompleted) return
      try {
        const errorData = JSON.parse(event.data)
        const errorMessage = errorData.message || '生成过程中出现错误'
        messages.value[aiMessageIndex].content = `❌ ${errorMessage}`
        messages.value[aiMessageIndex].loading = false
        message.error(errorMessage)
        streamCompleted = true
        isGenerating.value = false
        eventSource?.close()
      } catch (parseError) {
        handleError(new Error('服务器返回错误'), aiMessageIndex)
      }
    })

    eventSource.onerror = function () {
      if (streamCompleted || !isGenerating.value) return
      if (eventSource?.readyState === EventSource.CONNECTING) {
        streamCompleted = true
        isGenerating.value = false
        eventSource?.close()
        setTimeout(async () => {
          await fetchAppInfo()
          updatePreview()
          if (activeTab.value === 'code') {
            loadFileTree()
            stagedFiles.value.clear()
            modifiedKeys.value.clear()
          }
        }, 1000)
      } else {
        handleError(new Error('SSE连接错误'), aiMessageIndex)
      }
    }
  } catch (error) {
    console.error('创建 EventSource 失败：', error)
    handleError(error, aiMessageIndex)
  }
}

// 错误处理函数
const handleError = (error: unknown, aiMessageIndex: number) => {
  console.error('生成代码失败：', error)
  messages.value[aiMessageIndex].content = '抱歉，生成过程中出现了错误，请重试。'
  messages.value[aiMessageIndex].loading = false
  message.error('生成失败，请重试')
  isGenerating.value = false
}

// 更新预览
const updatePreview = () => {
  if (appId.value) {
    const codeGenType = appInfo.value?.codeGenType || CodeGenTypeEnum.HTML
    const newPreviewUrl = getStaticPreviewUrl(codeGenType, appId.value)
    previewUrl.value = newPreviewUrl
    previewReady.value = true
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 下载代码
const downloadCode = async () => {
  if (!appId.value) {
    message.error('应用ID不存在')
    return
  }
  downloading.value = true
  try {
    const API_BASE_URL = request.defaults.baseURL || ''
    const url = `${API_BASE_URL}/app/download/${appId.value}`
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    const contentDisposition = response.headers.get('Content-Disposition')
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] || `app-${appId.value}.zip`
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    link.click()
    URL.revokeObjectURL(downloadUrl)
    message.success('代码下载成功')
  } catch (error) {
    console.error('下载失败：', error)
    message.error('下载失败，请重试')
  } finally {
    downloading.value = false
  }
}

// 部署应用
const deployApp = async () => {
  if (!appId.value) {
    message.error('应用ID不存在')
    return
  }

  deploying.value = true
  try {
    const res = await deployAppApi({
      appId: appId.value as unknown as number,
    })

    if (res.data.code === 0 && res.data.data) {
      deployUrl.value = res.data.data
      deployModalVisible.value = true
      message.success('部署成功')
    } else {
      message.error('部署失败：' + res.data.message)
    }
  } catch (error) {
    console.error('部署失败：', error)
    message.error('部署失败，请重试')
  } finally {
    deploying.value = false
  }
}

// 在新窗口打开预览
const openInNewTab = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

// 打开部署的网站
const openDeployedSite = () => {
  if (deployUrl.value) {
    window.open(deployUrl.value, '_blank')
  }
}

// iframe加载完成
const onIframeLoad = () => {
  previewReady.value = true
  const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
  if (iframe) {
    visualEditor.init(iframe)
    visualEditor.onIframeLoad()
  }
}

// 编辑应用
const editApp = () => {
  if (appInfo.value?.id) {
    router.push(`/app/edit/${appInfo.value.id}`)
  }
}

// 删除应用
const deleteApp = async () => {
  if (!appInfo.value?.id) return

  try {
    const res = await deleteAppApi({ id: appInfo.value.id })
    if (res.data.code === 0) {
      message.success('删除成功')
      appDetailVisible.value = false
      router.push('/')
    } else {
      message.error('删除失败：' + res.data.message)
    }
  } catch (error) {
    console.error('删除失败：', error)
    message.error('删除失败')
  }
}

// 可视化编辑相关函数
const toggleEditMode = () => {
  const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
  if (!iframe) {
    message.warning('请等待页面加载完成')
    return
  }
  if (!previewReady.value) {
    message.warning('请等待页面加载完成')
    return
  }
  const newEditMode = visualEditor.toggleEditMode()
  isEditMode.value = newEditMode
}

const clearSelectedElement = () => {
  selectedElementInfo.value = null
  visualEditor.clearSelection()
}

const getInputPlaceholder = () => {
  if (selectedElementInfo.value) {
    return `正在编辑 ${selectedElementInfo.value.tagName.toLowerCase()} 元素，描述您想要的修改...`
  }
  return '请描述你想生成的网站，越详细效果越好哦'
}

// --- 代码编辑相关逻辑 ---

// 1. 获取文件树
const loadFileTree = async () => {
  if (!appId.value) return
  try {
    const res = await getFileTree({ appId: appId.value })
    if (res.data.code === 0) {
      fileTreeData.value = res.data.data
      if (fileTreeData.value.length > 0) {
        expandedKeys.value = [fileTreeData.value[0].key as string]
      }
    }
  } catch (error) {
    console.error('获取文件树失败', error)
    message.error('无法加载项目文件结构')
  }
}

// 2. 点击文件树节点，加载代码
const onSelectFile = async (keys: string[], info: any) => {
  if (keys.length === 0 || !info.node.isLeaf) return
  
  const path = keys[0]
  if (path === currentFilePath.value) return

  // 1. 如果该文件在本地暂存中有记录，直接使用暂存内容
  if (stagedFiles.value.has(path)) {
    currentCode.value = stagedFiles.value.get(path)!
    currentFilePath.value = path
    return
  }

  // 2. 否则从后端拉取
  isCodeLoading.value = true
  try {
    const res = await getAppCodeContent({ 
      appId: appId.value, 
      filePath: path 
    })
    if (res.data.code === 0) {
      currentCode.value = res.data.data
      currentFilePath.value = path
      // 记录原始内容，用于比对
      originalFileContent.value.set(path, res.data.data)
    }
  } catch (error) {
    console.error('读取文件失败', error)
    message.error('读取文件内容失败')
  } finally {
    isCodeLoading.value = false
  }
}

// 3. 处理编辑器挂载，绑定快捷键
const handleEditorMount = (editor: any) => {
  // 绑定 Ctrl+S / Cmd+S
  editor.addCommand(2048 | 49, () => { // 2048 is Ctrl/Cmd, 49 is 'S' key code
    handleLocalSave()
  })
}

// 4. 本地暂存 (Ctrl+S)
const handleLocalSave = () => {
  if (!currentFilePath.value) return
  
  // 保存当前内容到暂存区
  stagedFiles.value.set(currentFilePath.value, currentCode.value)
  // 标记文件为已修改
  modifiedKeys.value.add(currentFilePath.value)
  
  message.success({ content: '已暂存到本地 (Ctrl+S)', duration: 1 })
}

// 判断是否有未保存的更改
const hasUnsavedChanges = (filePath: string) => {
  return modifiedKeys.value.has(filePath)
}

// 5. 保存并运行 (提交到后端)
const saveAndRunCode = async () => {
  if (!currentFilePath.value) return
  
  isSaving.value = true
  try {
    const res = await updateAppCode({
      appId: appId.value,
      filePath: currentFilePath.value,
      content: currentCode.value
    })
    
    if (res.data.code === 0) {
      message.success('保存成功，正在重新部署...')
      // 清除该文件的暂存状态
      modifiedKeys.value.delete(currentFilePath.value)
      // 更新原始内容缓存
      originalFileContent.value.set(currentFilePath.value, currentCode.value)
      
      // 强制刷新 iframe
      const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
      if (iframe) {
        const currentSrc = iframe.src.split('?')[0]
        iframe.src = `${currentSrc}?t=${Date.now()}`
      }
    } else {
      message.error(res.data.message || '保存失败')
    }
  } catch (error) {
    message.error('保存失败')
  } finally {
    isSaving.value = false
  }
}

// 6. 切换 Tab 时的处理
const handleTabChange = (key: 'preview' | 'code') => {
  activeTab.value = key
  if (key === 'code') {
    if (fileTreeData.value.length === 0) {
      loadFileTree()
    }
  }
}

onMounted(() => {
  fetchAppInfo()
  window.addEventListener('message', (event) => {
    visualEditor.handleIframeMessage(event)
  })
})

onUnmounted(() => {
})
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#appChatPage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: #f8fafc;
  position: relative;
  overflow: hidden;
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
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
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
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
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
#appChatPage {
  position: relative;
  z-index: 1;
}

/* 顶部栏 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.header-bar:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
/* 标签样式 */
.code-gen-type-tag {
  font-size: 12px;
  padding: 6px 16px;
  line-height: 1.5;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  border: none;
  color: white !important;
  margin-left: 12px;
}

.app-name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 自定义按钮样式 */
.custom-button {
  border-radius: 12px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  padding: 6px 16px !important;
  height: 40px !important;
}

.custom-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.primary-button {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
  border: none !important;
  color: white !important;
}

.primary-button:hover {
  background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
}

.ghost-button {
  background: rgba(255, 255, 255, 0.7) !important;
  border: 1px solid #e2e8f0 !important;
  color: #3b82f6 !important;
}

.ghost-button:hover {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: #3b82f6 !important;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  /* 移除 gap，使用 margin 控制间距以实现平滑收起 */
  padding: 0;
  overflow: hidden;
}

/* 通用卡片样式 */
.card-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease; 
}

/* 左侧对话区域 */
.chat-section {
  flex: 2; /* 默认宽度比例 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0; /* 防止内容撑开 */
  margin-right: 20px; /* 使用 margin 代替 gap */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
}

/* 隐藏聊天区域的状态 */
.chat-section.collapsed {
  flex: 0 0 0;
  width: 0;
  margin-right: 0; /* 收起时 margin 也变为 0 */
  padding: 0;
  margin: 0;
  opacity: 0;
  border: none;
  box-shadow: none; /* 确保阴影也消失 */
  overflow: hidden;
}

.messages-container {
  flex: 0.9;
  padding: 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.15);
}

.message-item {
  margin-bottom: 12px;
}

.user-message {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 8px;
}

.ai-message {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
}

.message-content {
  max-width: 70%;
  padding: 14px 18px;
  border-radius: 18px;
  line-height: 1.5;
  word-wrap: break-word;
  font-size: 14px;
  transition: all 0.3s ease;
}

.user-message .message-content {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.ai-message .message-content {
  background: #f8fafc;
  color: #1e293b;
  padding: 14px 18px;
  border: 1px solid #e2e8f0;
}

.ai-message .message-content:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.message-avatar {
  flex-shrink: 0;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-radius: 8px;
}

/* 加载更多按钮 */
.load-more-container {
  text-align: center;
  padding: 8px 0;
  margin-bottom: 16px;
}

/* 输入区域 */
.input-container {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e2e8f0;
}

.input-wrapper {
  position: relative;
}

.input-wrapper .ant-input {
  padding-right: 50px;
}

.input-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

/* 右侧预览区域 */
.preview-section {
  flex: 3; /* 默认宽度比例 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 全屏状态 */
.preview-section.expanded {
  flex: 1;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.5);
}

.header-tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.tab-item {
  padding: 6px 16px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  user-select: none;
}

.tab-item:hover {
  background: rgba(255, 255, 255, 0.5);
  color: #3b82f6;
}

.tab-item.active {
  background: white;
  color: #3b82f6;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unsaved-tip {
  font-size: 12px;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-actions .ant-btn {
  border-radius: 8px !important;
  font-size: 13px !important;
  transition: all 0.3s ease !important;
}

.save-code-btn {
  border-radius: 6px !important;
}

.preview-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
  display: flex;
}

.preview-iframe-container {
  width: 100%;
  height: 100%;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  margin: 20px;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  margin: 20px;
}

.preview-loading p {
  margin-top: 16px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  transition: all 0.3s ease;
}

/* 代码编辑器布局 */
.code-editor-container {
  display: flex;
  height: 100%;
  width: 100%;
  background: white;
  overflow: hidden;
}

.file-tree-sidebar {
  width: 240px;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  padding: 10px 0;
  background: #fafafa;
  flex-shrink: 0;
}

/* 树节点样式 */
.tree-node-title {
  display: flex;
  align-items: center;
}

.modified-indicator {
  color: #f59e0b; /* 橙色 */
  margin-left: 4px;
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
}

.code-editor-main {
  flex: 1;
  position: relative;
  overflow: hidden;
  height: 100%;
}

.editor-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
}

.editor-spin-wrapper {
  height: 100%;
  width: 100%;
}

.editor-spin-wrapper :deep(.ant-spin-container) {
  height: 100%;
}

.empty-tree {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

/* 调整 Ant Tree 样式 */
:deep(.ant-tree) {
  background: transparent;
}
:deep(.ant-tree-node-content-wrapper) {
  padding: 4px 0 !important;
  transition: all 0.2s;
}
:deep(.ant-tree-node-selected .ant-tree-node-content-wrapper) {
  background-color: #eff6ff !important;
  color: #3b82f6;
}

.selected-element-alert {
  margin: 0 20px;
  border-radius: 12px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .chat-section {
    margin-right: 0;
    margin-bottom: 16px; /* 移动端改为底部间距 */
  }

  .chat-section,
  .preview-section {
    flex: none;
    height: 50vh;
  }
  
  /* 移动端取消动画折叠逻辑，保持上下布局 */
  .chat-section.collapsed {
    flex: none;
    height: 0;
    margin: 0;
    opacity: 0;
  }
  
  .preview-section.expanded {
    height: 80vh; /* 移动端代码编辑占更多屏 */
  }

  .header-bar {
    padding: 14px 16px;
    margin-bottom: 16px;
  }

  .app-name {
    font-size: 18px;
  }

  .header-right {
    gap: 8px;
  }

  .custom-button {
    font-size: 12px !important;
    padding: 4px 12px !important;
    height: 36px !important;
  }
}

@media (max-width: 768px) {
  #appChatPage {
    padding: 12px;
  }

  .header-bar {
    padding: 12px 14px;
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .header-left {
    justify-content: center;
  }

  .app-name {
    font-size: 16px;
  }

  .header-right {
    justify-content: center;
  }

  .main-content {
    padding: 0;
    gap: 12px;
  }

  .message-content {
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 16px;
  }

  .messages-container {
    padding: 16px;
  }

  .input-container {
    padding: 16px;
  }

  .preview-header {
    padding: 16px;
    flex-direction: column;
    gap: 10px;
  }

  .header-tabs {
    width: 100%;
    justify-content: center;
  }

  /* 选中元素信息样式 */
  .selected-element-alert {
    margin: 0 20px;
  }

  .element-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .element-tag {
    padding: 4px 10px;
    background-color: #e6f4ff;
    color: #3b82f6;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
  }

  .element-id {
    padding: 4px 8px;
    background-color: #f5f5f5;
    color: #666;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }

  .element-class {
    padding: 4px 8px;
    background-color: #f5f5f5;
    color: #666;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }

  .element-details {
    margin-top: 8px;
    line-height: 1.6;
  }

  .element-item {
    margin-bottom: 6px;
    font-size: 13px;
    color: #333;
  }

  .element-selector-code {
    background-color: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 12px;
    color: #3b82f6;
  }

  .selected-element-info {
    line-height: 1.4;
  }

  .element-tag {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 14px;
    font-weight: 600;
    color: #3b82f6;
  }

  .element-id {
    color: #10b981;
    margin-left: 4px;
  }

  .element-class {
    color: #f59e0b;
    margin-left: 4px;
  }

  .element-selector-code {
    font-family: 'Monaco', 'Menlo', monospace;
    background: #f1f5f9;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 12px;
    color: #ef4444;
    border: 1px solid #e2e8f0;
  }

  /* 编辑模式按钮样式 */
  .edit-mode-active {
    background: linear-gradient(135deg, #10b981, #059669) !important;
    border-color: #10b981 !important;
    color: white !important;
  }

  .edit-mode-active:hover {
    background: linear-gradient(135deg, #059669, #047857) !important;
    border-color: #059669 !important;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item {
  animation: fadeInUp 0.3s ease-out;
}

/* 输入框样式 */
.input-wrapper .ant-input-textarea {
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  transition: all 0.3s ease !important;
}

.input-wrapper .ant-input-textarea:hover {
  border-color: #94a3b8 !important;
}

.input-wrapper .ant-input-textarea:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}
</style>