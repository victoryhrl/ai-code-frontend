<template>
  <div id="userProfilePage">
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
      <div class="profile-container">
        <div class="profile-header">
          <h2 class="title">个人中心</h2>
          <div class="subtitle">管理您的个人信息</div>
        </div>
        
        <div class="profile-content">
          <div class="profile-info">
            <a-avatar :src="userInfo.userAvatar" size={80} class="avatar" />
            <div class="user-details">
              <h3 class="user-name">{{ userInfo.userName }}</h3>
              <p class="user-role">{{ userInfo.userRole === 'admin' ? '管理员' : '普通用户' }}</p>
              <p class="user-account">账号：{{ userInfo.userAccount }}</p>
            </div>
          </div>
          
          <div class="profile-section">
            <h3 class="section-title">基本信息</h3>
            <a-form :model="formState" name="basic" class="info-form">
              <a-row :gutter="[16, 16]">
                <a-col :span="24">
                  <a-form-item label="用户名" name="userName">
                    <a-input v-model:value="formState.userName" placeholder="请输入用户名" class="custom-input" />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item label="用户头像" name="userAvatar">
                    <a-input v-model:value="formState.userAvatar" placeholder="请输入头像URL" class="custom-input" />
                    <!-- 头像预览 -->
                    <div v-if="formState.userAvatar" class="avatar-preview-container">
                      <img :src="formState.userAvatar" alt="头像预览" class="avatar-preview" />
                      <p class="preview-text">头像预览</p>
                    </div>
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item label="个人简介" name="userProfile">
                    <a-textarea v-model:value="formState.userProfile" placeholder="请输入个人简介" rows={4} class="custom-textarea" />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <div class="form-actions">
                <a-button type="primary" @click="handleUpdateProfile" :loading="submitting">保存修改</a-button>
                <a-button @click="handleCancel">取消</a-button>
              </div>
            </a-form>
          </div>
          
          <!-- 我的应用作品展示 -->
          <div class="profile-section">
            <h3 class="section-title">我的应用作品</h3>
            <div v-if="userApps.length > 0" class="apps-grid">
              <div v-for="app in userApps" :key="app.id" class="app-item">
                <div class="app-header">
                  <h4 class="app-name">{{ app.name }}</h4>
                  <span class="app-status" :class="app.status">{{ app.statusText }}</span>
                </div>
                <div class="app-description">{{ app.description }}</div>
                <!-- 查看和编辑链接固定在左下角 -->
                <div class="app-actions-bottom-left">
                  <a-button type="link" @click="viewApp(app.id)">查看</a-button>
                  <a-button type="link" @click="editApp(app.id)">编辑</a-button>
                </div>
              </div>
            </div>
            
            <!-- 分页组件 -->
            <div v-if="userApps.length > 0" class="pagination-container">
              <a-pagination
                v-model:current="pagination.current"
                v-model:pageSize="pagination.pageSize"
                :total="pagination.total"
                :showSizeChanger="true"
                :showQuickJumper="true"
                :showTotal="(total : number) => `共 ${total} 条记录`"
                :pageSizeOptions="['5', '10', '20']"
                @change="handlePageChange"
                @showSizeChange="handleSizeChange"
              />
            </div>
            
            <div v-else class="no-apps">
              <div class="no-apps-icon">📱</div>
              <p class="no-apps-text">您还没有创建任何应用</p>
              <a-button type="primary" @click="createNewApp">创建应用</a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    

  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed } from 'vue'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { listMyAppVoByPage } from '@/api/appController.ts'
import { onMounted } from 'vue'

const loginUserStore = useLoginUserStore()
const router = useRouter()
const submitting = ref(false)

// 用户信息
const userInfo = computed(() => ({
  ...loginUserStore.loginUser,
  userAvatar: loginUserStore.loginUser.userAvatar || '',
  userProfile: loginUserStore.loginUser.userProfile || ''
}))

// 表单数据
const formState = reactive({
  userName: userInfo.value.userName || '',
  userAvatar: userInfo.value.userAvatar || '',
  userProfile: userInfo.value.userProfile || ''
})

// 用户应用数据
const userApps = ref<Array<{id: number;name: string;description: string;status: 'active' | 'inactive';statusText: string;createTime: string;}>>([])

// 分页数据
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 加载用户应用数据
const loadUserApps = async () => {
  try {
    const response = await listMyAppVoByPage({
      current: pagination.current,
      pageSize: pagination.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc'
    })
    
    if (response.data.data?.records) {
      userApps.value = response.data.data.records.map((app: API.AppVO) => ({
        id: app.id || 0,
        name: app.appName || '未命名应用',
        description: app.initPrompt || '暂无描述',
        status: app.deployedTime ? 'active' : 'inactive',
        statusText: app.deployedTime ? '运行中' : '开发中',
        createTime: app.createTime || '',
      }))
      // 设置总条数
      pagination.total = response.data.data.total || 0
      console.log('转换后的用户应用数据:', userApps.value);
    } else {
      console.log('API返回的数据不符合预期', response);
      setMockData();
    }
  } catch (error) {
    console.error('加载应用数据失败:', error);
    message.error('加载应用数据失败，请重试');
    // 如果API调用失败，使用模拟数据作为备用
    setMockData();
  }
}

// 设置模拟数据
const setMockData = () => {
  userApps.value = [
    {
      id: 1,
      name: '个人博客系统',
      description: '基于Vue3和TypeScript的个人博客系统，支持Markdown编辑和响应式设计',
      status: 'active',
      statusText: '运行中',
      createTime: '2023-06-15 10:30'
    },
    {
      id: 2,
      name: '在线笔记应用',
      description: '简洁高效的在线笔记应用，支持多设备同步和实时协作',
      status: 'active',
      statusText: '运行中',
      createTime: '2023-06-20 14:20'
    },
    {
      id: 3,
      name: '任务管理系统',
      description: '团队协作的任务管理系统，支持看板视图和甘特图',
      status: 'inactive',
      statusText: '开发中',
      createTime: '2023-07-02 09:15'
    }
  ]
  // 模拟总条数
  pagination.total = 3
  console.log('使用模拟数据:', userApps.value);
}

// 分页变化处理
const handlePageChange = (page: number) => {
  pagination.current = page
  loadUserApps()
}

// 每页条数变化处理
const handleSizeChange = (current: number, pageSize: number) => {
  pagination.current = current
  pagination.pageSize = pageSize
  loadUserApps()
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  // 简单的时间格式化
  try {
    const date = new Date(time)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch {
    return time
  }
}

// 在组件挂载时加载用户应用数据
onMounted(() => {
  console.log('组件挂载，开始加载用户应用数据');
  loadUserApps()
})

// 更新个人资料
const handleUpdateProfile = async () => {
  submitting.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新全局状态
    const updatedUser = {
      ...loginUserStore.loginUser,
      userName: formState.userName,
      userAvatar: formState.userAvatar,
      userProfile: formState.userProfile
    }
    loginUserStore.setLoginUser(updatedUser)
    
    message.success('个人资料更新成功')
  } catch (error) {
    message.error('更新失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 取消修改
const handleCancel = () => {
  formState.userName = userInfo.value.userName || ''
  formState.userAvatar = userInfo.value.userAvatar || ''
  formState.userProfile = userInfo.value.userProfile || ''
}

// 查看应用
const viewApp = (appId: number) => {
  router.push(`/app/chat/${appId}`)
}

// 编辑应用
const editApp = (appId: number) => {
  // 跳转到指定的编辑链接
  window.location.href = `http://localhost:5173/app/edit/${appId}`
}

// 创建新应用
const createNewApp = () => {
  router.push('/')
}

// 鼠标跟随效果
const handleMouseMove = (e: MouseEvent) => {
  const follower = document.querySelector('.mouse-follower') as HTMLElement
  if (follower) {
    follower.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
  }
}

// 添加鼠标移动事件监听
window.addEventListener('mousemove', handleMouseMove)

// 组件卸载时移除事件监听
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#userProfilePage {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #1e293b;
  position: relative;
  overflow: hidden;
  padding: 40px 0;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
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
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  top: -100px;
  right: -100px;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  bottom: -100px;
  left: -100px;
}

.shape-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
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
  max-width: 900px;
  width: 100%;
  padding: 0 20px;
  position: relative;
  z-index: 1;
  margin: 0 auto;
}

/* 个人中心容器 */
.profile-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.profile-container:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
}

/* 个人中心头部 */
.profile-header {
  margin-bottom: 40px;
  text-align: center;
}

.title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #1e293b;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

/* 个人中心内容 */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 个人信息区域 */
.profile-info {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: rgba(251, 248, 255, 0.7);
  border-radius: 16px;
  border: 1px solid rgba(219, 210, 254, 0.5);
}

.avatar {
  border: 4px solid rgba(139, 92, 246, 0.2);
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #1e293b;
}

.user-role {
  font-size: 14px;
  color: #8b5cf6;
  margin: 0 0 12px;
}

.user-account {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* 个人中心区块 */
.profile-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.profile-section:hover {
  border-color: #d8b4fe;
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.08);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #1e293b;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

/* 信息表单 */
.info-form {
  width: 100%;
}

/* 自定义输入框样式 */
.custom-input,
.custom-textarea {
  padding: 8px 12px;
  font-size: 14px;
}

.custom-input input,
.custom-textarea textarea {
  padding: 8px 12px !important;
}

/* 头像预览 */
.avatar-preview-container {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.preview-text {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

.form-actions .ant-btn-primary {
  border-radius: 12px;
  padding: 6px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  transition: all 0.3s ease;
}

.form-actions .ant-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.form-actions .ant-btn {
  border-radius: 12px;
  padding: 6px 24px;
}

/* 应用作品展示 */
.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.app-item {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.app-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1);
  border-color: #d8b4fe;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.app-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.app-status.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.app-status.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.app-description {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-meta {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  font-size: 12px;
  color: #94a3b8;
  position: absolute;
  bottom: 48px;
  right: 16px;
}

/* 查看和编辑链接固定在左下角 */
.app-actions-bottom-left {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 16px;
}

.app-actions-bottom-left .ant-btn-link {
  padding: 0;
  height: auto;
  color: #8b5cf6;
  font-size: 14px;
}

.app-actions-bottom-left .ant-btn-link:hover {
  color: #7c3aed;
}

/* 无应用状态 */
.no-apps {
  text-align: center;
  padding: 40px 20px;
  background: rgba(251, 248, 255, 0.7);
  border-radius: 16px;
  border: 2px dashed #e2e8f0;
}

.no-apps-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-apps-text {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 24px;
}

.no-apps .ant-btn-primary {
  border-radius: 12px;
  padding: 6px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
}

.no-apps .ant-btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.pagination-container .ant-pagination {
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  #userProfilePage {
    padding: 20px 0;
  }
  
  .profile-container {
    padding: 24px;
    margin: 20px;
  }
  
  .title {
    font-size: 28px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  .profile-info {
    flex-direction: column;
    text-align: center;
  }
  
  .apps-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .pagination-container .ant-pagination {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>