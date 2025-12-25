<template>
  <div id="teamDetailPage">
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
      <div class="team-detail-container">
        <a-spin :spinning="loading">
          <!-- 团队基本信息 -->
          <div class="team-header">
            <div class="team-header-left">
              <h2 class="title">{{ team?.teamName || '加载中...' }}</h2>
              <div class="team-subtitle">团队协作 · 共同创造</div>
            </div>
            <div class="team-header-right">
              <a-button @click="goBack" class="action-btn secondary">
                <ArrowLeftOutlined /> 返回
              </a-button>
              <a-button 
                v-if="canManageTeam" 
                type="primary" 
                @click="editTeam"
                class="action-btn primary"
              >
                <EditOutlined /> 编辑团队
              </a-button>
              <a-button 
                v-if="canManageTeam" 
                danger
                @click="confirmDissolveTeam"
                class="action-btn danger"
              >
                <DeleteOutlined /> 解散队伍
              </a-button>
              <a-button 
                v-if="appId == null && canManageTeam" 
                type="primary" 
                @click="createApp"
                class="action-btn create"
              >
                <PlusOutlined /> 创建应用
              </a-button>
              <a-button 
                v-if="appId != null" 
                type="primary" 
                @click="viewApp"
                class="action-btn view"
              >
                <CodeOutlined /> 查看应用
              </a-button>
            </div>
          </div>
          
          <!-- 团队信息卡片 -->
          <a-card class="team-info-card" v-if="team">
            <div class="team-info">
              <div class="info-item">
                <div class="info-icon">
                  <UserOutlined />
                </div>
                <div class="info-content">
                  <span class="info-label">创建者</span>
                  <div class="info-value">
                    <UserInfo v-if="getTeamCreator()" :user="getTeamCreator()" />
                    <span v-else>未知</span>
                  </div>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">
                  <TeamOutlined />
                </div>
                <div class="info-content">
                  <span class="info-label">成员数</span>
                  <span class="info-value">{{ teamUsers.length || 0 }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">
                  <CalendarOutlined />
                </div>
                <div class="info-content">
                  <span class="info-label">创建时间</span>
                  <span class="info-value">{{ formatDate(team.createTime) }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">
                  <span class="role-icon">👤</span>
                </div>
                <div class="info-content">
                  <span class="info-label">您的角色</span>
                  <a-tag :color="getTeamRoleColor(currentUserTeamRole)" class="role-tag">
                    {{ getTeamRoleText(currentUserTeamRole) }}
                  </a-tag>
                </div>
              </div>
            </div>
          </a-card>
          
          <!-- 团队成员列表 -->
          <div class="team-members-section">
            <div class="section-header">
              <h3 class="section-title">团队成员</h3>
              <a-button 
                v-if="canManageTeam" 
                type="primary" 
                @click="showAddMemberModal"
                class="add-member-btn"
              >
                <UserAddOutlined /> 添加成员
              </a-button>
            </div>
            
            <div class="table-container">
              <a-table
                :dataSource="teamUsers"
                :columns="columns"
                :pagination="false"
                :rowKey="(record: API.TeamUserVO) => record.id || ''"
                class="members-table"
              >
                <!-- 用户信息列 -->
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'user'">
                    <UserInfo :user="record.userVO" />
                  </template>
                  
                  <!-- 角色列 -->
                  <template v-if="column.key === 'role'">
                    <a-tag :color="getTeamRoleColor(record.teamRole)" class="role-tag">
                      {{ getTeamRoleText(record.teamRole) }}
                    </a-tag>
                  </template>
                  
                  <!-- 加入时间列 -->
                  <template v-if="column.key === 'joinTime'">
                    <span class="join-time">{{ formatDate(record.createTime) }}</span>
                  </template>
                  
                  <!-- 操作列 -->
                  <template v-if="column.key === 'action'">
                    <div class="action-buttons">
                      <a-button 
                        v-if="canManageTeam && record.teamRole !== 'admin' && record.userId !== loginUserStore.loginUser.id" 
                        type="link" 
                        size="small"
                        @click="() => showEditRoleModal(record)"
                        class="edit-role-btn"
                      >
                        <EditOutlined /> 修改角色
                      </a-button>
                      <a-button 
                        v-if="canManageTeam && record.teamRole !== 'admin' && record.userId !== loginUserStore.loginUser.id" 
                        type="link" 
                        danger 
                        size="small"
                        @click="() => confirmRemoveMember(record)"
                        class="remove-member-btn"
                      >
                        <DeleteOutlined /> 移除
                      </a-button>
                    </div>
                  </template>
                </template>
              </a-table>
            </div>
          </div>
        </a-spin>
      </div>
    </div>
    
    <!-- 编辑团队的模态框 -->
    <a-modal
      v-model:visible="editTeamModalVisible"
      title="编辑团队信息"
      @ok="handleEditTeam"
      :confirmLoading="editTeamSubmitting"
      class="edit-team-modal"
    >
      <div class="edit-team-content">
        <div class="form-group">
          <label class="form-label">团队名称：</label>
          <a-input
            v-model:value="editTeamName"
            placeholder="输入团队名称"
            :disabled="editTeamSubmitting"
            class="form-input"
          />
        </div>
      </div>
    </a-modal>
    
    <!-- 编辑角色的模态框 -->
    <a-modal
      v-model:visible="roleModalVisible"
      title="修改成员角色"
      @ok="handleEditRole"
      :confirmLoading="submitting"
      @cancel="roleModalVisible = false"
      class="role-modal"
    >
      <div v-if="currentEditUser" class="role-modal-content">
        <p class="role-modal-text">修改 {{ currentEditUser.userVO?.userName || '成员' }} 的角色：</p>
        <a-radio-group v-model:value="editRoleValue" :disabled="submitting" class="role-radio-group">
          <a-radio value="admin" class="role-radio">管理员</a-radio>
          <a-radio value="editor" class="role-radio">编辑者</a-radio>
          <a-radio value="viewer" class="role-radio">浏览者</a-radio>
        </a-radio-group>
      </div>
    </a-modal>
  
    <!-- 添加成员的模态框 -->
    <a-modal
      v-model:visible="addMemberModalVisible"
      title="添加团队成员"
      @ok="handleAddMember"
      :confirmLoading="addMemberSubmitting"
      class="add-member-modal"
    >
      <div class="add-member-content">
        <div class="form-group">
          <label class="form-label">用户ID：</label>
          <a-input
            v-model:value="directUserId"
            placeholder="输入用户ID"
            :disabled="addMemberSubmitting"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">选择角色：</label>
          <a-radio-group v-model:value="selectedUserRole" :disabled="addMemberSubmitting" class="role-radio-group">
            <a-radio value="admin" class="role-radio">管理员</a-radio>
            <a-radio value="editor" class="role-radio">编辑者</a-radio>
            <a-radio value="viewer" class="role-radio">浏览者</a-radio>
          </a-radio-group>
        </div>
        
        <div class="role-description">
          <p class="description-title">角色说明：</p>
          <ul class="description-list">
            <li><strong>浏览者(viewer)：</strong> 可以查看团队内容</li>
            <li><strong>编辑者(editor)：</strong> 可以编辑团队内容</li>
            <li><strong>管理员(admin)：</strong> 可以管理团队成员和内容</li>
          </ul>
        </div>
      </div>
    </a-modal>

    <!-- 创建应用的模态框 -->
    <a-modal
      v-model:visible="createAppModalVisible"
      title="创建团队应用"
      @ok="handleCreateApp"
      :confirmLoading="createAppSubmitting"
      width="600px"
      class="create-app-modal"
    >
      <div class="create-app-content">
        <div class="form-group">
          <label class="form-label">应用描述：</label>
          <a-textarea
            v-model:value="appPrompt"
            placeholder="例如：创建一个现代化的个人博客网站"
            :rows="4"
            :maxlength="1000"
            class="form-textarea"
          />
        </div>
        
        <!-- 预设提示词选项 -->
        <div class="preset-prompts">
          <p class="preset-title">快速选择：</p>
          <div class="prompt-buttons">
            <a-button
              type="default"
              @click="setAppPrompt('创建一个现代化的个人博客网站，包含文章列表、详情页、分类标签、搜索功能、评论系统和个人简介页面。采用简洁的设计风格，支持响应式布局，文章支持Markdown格式，首页展示最新文章和热门推荐。')"
              class="prompt-btn"
            >
              个人博客网站
            </a-button>
            <a-button
              type="default"
              @click="setAppPrompt('设计一个专业的企业官网，包含公司介绍、产品服务展示、新闻资讯、联系我们等页面。采用商务风格的设计，包含轮播图、产品展示卡片、团队介绍、客户案例展示，支持多语言切换和在线客服功能。')"
              class="prompt-btn"
            >
              企业官网
            </a-button>
            <a-button
              type="default"
              @click="setAppPrompt('构建一个功能完整的在线商城，包含商品展示、购物车、用户注册登录、订单管理、支付结算等功能。设计现代化的商品卡片布局，支持商品搜索筛选、用户评价、优惠券系统和会员积分功能。')"
              class="prompt-btn"
            >
              在线商城
            </a-button>
            <a-button
              type="default"
              @click="setAppPrompt('制作一个精美的作品展示网站，适合设计师、摄影师、艺术家等创作者。包含作品画廊、项目详情页、个人简历、联系方式等模块。采用瀑布流或网格布局展示作品，支持图片放大预览和作品分类筛选。')"
              class="prompt-btn"
            >
              作品展示网站
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import { 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UserAddOutlined,
  PlusOutlined,
  CodeOutlined
} from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { getTeamUserVoById, addTeamUser, deleteTeamUser, editTeamUser } from '@/api/teamUserController'
import { addApp as createTeamApp, editTeam as editTeamApi, deleteTeam } from '@/api/teamController'
import UserInfo from '@/components/UserInfo.vue'

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

// 获取路由参数中的团队ID
const teamId = computed(() => {
  const id = route.params.id
  return id
})

// 创建应用相关状态
const createAppModalVisible = ref(false)
const appPrompt = ref('')
const createAppSubmitting = ref(false)

// 编辑团队相关状态
const editTeamModalVisible = ref(false)
const editTeamName = ref('')
const editTeamSubmitting = ref(false)

// 设置应用提示词
const setAppPrompt = (prompt: string) => {
  appPrompt.value = prompt
}

// 创建应用函数
const createApp = () => {
  createAppModalVisible.value = true
  appPrompt.value = ''
}

// 处理创建应用
const handleCreateApp = async () => {
  if (!appPrompt.value.trim()) {
    message.warning('请输入应用描述')
    return
  }

  if (!teamId.value) {
    message.error('团队ID不存在')
    return
  }

  createAppSubmitting.value = true
  try {
    const res = await createTeamApp({
      id: String(teamId.value),
      prompt: appPrompt.value.trim()
    })

    if (res.data.code === 0 && res.data.data) {
      message.success('应用创建成功')
      createAppModalVisible.value = false
      // 跳转到应用聊天页面
      const appId = String(res.data.data)
      await router.push(`/app/chat/${appId}`)
    } else {
      message.error('创建失败：' + res.data.message)
    }
  } catch (error) {
    console.error('创建应用失败：', error)
    message.error('创建失败，请重试')
  } finally {
    createAppSubmitting.value = false
  }
}

// 查看应用函数
const viewApp = () => {
  if (appId.value && teamId.value) {
    router.push(`/team/${teamId.value}/app/chat/${appId.value}`)
  }
}

// 编辑团队函数
const editTeam = () => {
  editTeamModalVisible.value = true
  editTeamName.value = team.value?.teamName || ''
}

// 处理编辑团队
const handleEditTeam = async () => {
  if (!editTeamName.value.trim()) {
    message.warning('请输入团队名称')
    return
  }

  if (!teamId.value) {
    message.error('团队ID不存在')
    return
  }

  editTeamSubmitting.value = true
  try {
    const res = await editTeamApi({
      id: String(teamId.value),
      teamName: editTeamName.value.trim()
    })

    if (res.data.code === 0) {
      message.success('团队信息修改成功')
      editTeamModalVisible.value = false
      // 重新加载团队成员列表以更新团队信息
      await fetchTeamMembers()
    } else {
      message.error('修改失败：' + res.data.message)
    }
  } catch (error) {
    console.error('修改团队信息失败：', error)
    message.error('修改失败，请重试')
  } finally {
    editTeamSubmitting.value = false
  }
}

// 团队数据
const teamUsers = ref<API.TeamUserVO[]>([])
const loading = ref(true)

// 从团队成员中获取团队信息
const team = computed(() => {
  if (teamUsers.value && teamUsers.value.length > 0) {
    return teamUsers.value[0].teamVO
  }
  return undefined
})

// 获取当前用户在团队中的角色
const currentUserTeamRole = computed(() => {
  if (!teamUsers.value || !loginUserStore.loginUser.id) return undefined
  const currentUserTeamInfo = teamUsers.value.find(item => item.userId === loginUserStore.loginUser.id)
  return currentUserTeamInfo?.teamRole
})

// 表格列定义
const columns = [
  {
    title: '成员',
    key: 'user',
    dataIndex: 'userVO',
  },
  {
    title: '角色',
    key: 'role',
    dataIndex: 'teamRole',
  },
  {
    title: '加入时间',
    key: 'joinTime',
    dataIndex: 'createTime',
  },
  {
    title: '操作',
    key: 'action',
  },
]

// 编辑角色相关
const roleModalVisible = ref(false)
const currentEditUser = ref<API.TeamUserVO>()
const editRoleValue = ref<string>('')
const submitting = ref(false)
const appId = ref<number | null>(null)

// 判断当前用户是否可以管理团队
const canManageTeam = computed(() => {
  if (!currentUserTeamRole.value) return false
  return ['admin'].includes(currentUserTeamRole.value)
})

// 获取团队成员列表
const fetchTeamMembers = async () => {
  if (!teamId.value || !loginUserStore.loginUser.id) {
    message.warning('请先登录')
    await router.push('/user/login')
    return
  }
  
  loading.value = true
  try {
    const res = await getTeamUserVoById({ teamId: String(teamId.value) })
    if (res.data.code === 0 && res.data.data) {
      teamUsers.value = res.data.data || []
      appId.value = res.data.data[0].teamVO?.appId || null
    } else {
      message.error('获取团队成员失败：' + res.data.message)
    }
  } catch (error) {
    console.error('获取团队成员失败：', error)
    message.error('获取团队成员失败，请重试')
  } finally {
    loading.value = false
  }
  console.log('appId', appId.value)
}

// 获取团队创建者信息
const getTeamCreator = () => {
  if (!teamUsers.value) return undefined
  const owner = teamUsers.value.find(item => item.teamRole === 'admin')
  return owner?.userVO
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 获取团队角色文本
const getTeamRoleText = (role?: string) => {
  switch (role) {
    case 'admin':
      return '管理员'
    case 'editor':
      return '编辑者'
    case 'viewer':
      return '浏览者'
    default:
      return '未知'
  }
}

// 获取团队角色颜色
const getTeamRoleColor = (role?: string) => {
  switch (role) {
    case 'admin':
      return 'blue'
    case 'editor':
      return 'purple'
    case 'viewer':
      return 'green'
    default:
      return 'default'
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 显示编辑角色模态框
const showEditRoleModal = (user: API.TeamUserVO) => {
  currentEditUser.value = user
  editRoleValue.value = user.teamRole || 'viewer'
  roleModalVisible.value = true
}

// 处理编辑角色
const handleEditRole = async () => {
  if (!currentEditUser.value || !currentEditUser.value.id) {
    message.error('用户信息不完整')
    return
  }
  
  submitting.value = true
  try {
    const res = await editTeamUser({
      id: currentEditUser.value.id,
      teamRole: editRoleValue.value
    })
    
    if (res.data.code === 0) {
      message.success('角色修改成功')
      roleModalVisible.value = false
      // 重新加载成员列表
      await fetchTeamMembers()
    } else {
      message.error('修改角色失败：' + res.data.message)
    }
  } catch (error) {
    console.error('修改角色失败：', error)
    message.error('修改角色失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 确认移除成员
const confirmRemoveMember = (user: API.TeamUserVO) => {
  Modal.confirm({
    title: '确认移除成员',
    content: `您确定要将 ${user.userVO?.userName || '该成员'} 从团队中移除吗？`,
    okText: '确认移除',
    cancelText: '取消',
    okType: 'danger',
    onOk: () => removeMember(user),
  })
}

// 移除成员
const removeMember = async (user: API.TeamUserVO) => {
  if (!user.id) {
    message.error('用户信息不完整')
    return
  }
  
  try {
    const res = await deleteTeamUser({
      id: user.id
    })
    
    if (res.data.code === 0) {
      message.success('成员已移除')
      // 重新加载成员列表
      await fetchTeamMembers()
    } else {
      message.error('移除成员失败：' + res.data.message)
    }
  } catch (error) {
    console.error('移除成员失败：', error)
    message.error('移除成员失败，请重试')
  }
}

// 添加成员相关状态
const addMemberModalVisible = ref(false)
const directUserId = ref<string>('')
const selectedUserRole = ref('viewer')
const addMemberSubmitting = ref(false)

// 显示添加成员模态框
const showAddMemberModal = () => {
  addMemberModalVisible.value = true
  directUserId.value = ''
  selectedUserRole.value = 'viewer'
}

// 添加成员
const handleAddMember = async () => {
  if (!directUserId.value || isNaN(Number(directUserId.value))) {
    message.warning('请输入有效的用户ID')
    return
  }
  
  if (!teamId.value) {
    message.error('团队ID不存在')
    return
  }
  
  addMemberSubmitting.value = true
  try {
    const res = await addTeamUser({
      teamId: String(teamId.value),
      userId: String(directUserId.value),
      teamRole: selectedUserRole.value
    })
    
    if (res.data.code === 0) {
      message.success('添加成员成功')
      addMemberModalVisible.value = false
      // 重新加载成员列表
      await fetchTeamMembers()
    } else {
      message.error('添加成员失败：' + res.data.message)
    }
  } catch (error) {
    console.error('添加成员失败：', error)
    message.error('添加成员失败，请重试')
  } finally {
    addMemberSubmitting.value = false
  }
}

// 确认解散队伍
const confirmDissolveTeam = () => {
  Modal.confirm({
    title: '确认解散队伍',
    content: `您确定要解散队伍 "${team.value?.teamName || '该队伍'}" 吗？此操作不可撤销，所有成员将被移除，相关数据将被删除。`,
    okText: '确认解散',
    cancelText: '取消',
    okType: 'danger',
    onOk: () => dissolveTeam(),
  })
}

// 解散队伍
const dissolveTeam = async () => {
  if (!teamId.value) {
    message.error('团队ID不存在')
    return
  }
  
  try {
    const res = await deleteTeam({
      id: String(teamId.value)
    })
    
    if (res.data.code === 0) {
      message.success('队伍已成功解散')
      // 跳转到我的队伍页面
      await router.push('/team/my')
    } else {
      message.error('解散队伍失败：' + res.data.message)
    }
  } catch (error) {
    console.error('解散队伍失败：', error)
    message.error('解散队伍失败，请重试')
  }
}

// 页面加载时获取团队成员列表
onMounted(() => {
  fetchTeamMembers()
})
</script>

<style scoped>
#teamDetailPage {
  position: relative;
  min-height: calc(100vh - 64px);
  padding: 40px 0;
  overflow-x: hidden;
}

.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%);
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
  filter: blur(80px);
  opacity: 0.3;
}

.shape-1 {
  top: 10%;
  left: 10%;
  width: 300px;
  height: 300px;
  background: linear-gradient(45deg, #8b5cf6, #a78bfa);
}

.shape-2 {
  bottom: 20%;
  right: 10%;
  width: 400px;
  height: 400px;
  background: linear-gradient(45deg, #2563eb, #7c3aed);
}

.shape-3 {
  top: 40%;
  right: 30%;
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #06b6d4, #8b5cf6);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

.team-detail-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 48px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f1f5f9;
}

.team-header-left .title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.team-subtitle {
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
}

.team-header-right {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.action-btn {
  border-radius: 50px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 14px;
  height: 44px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.action-btn.secondary {
  background: white;
  border: 2px solid #e2e8f0;
  color: #64748b;
}

.action-btn.secondary:hover {
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.action-btn.primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.action-btn.create {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border: none;
  color: white;
}

.action-btn.create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.action-btn.view {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  border: none;
  color: white;
}

.action-btn.view:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  border: none;
  color: white;
}

.action-btn.danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
}

.team-info-card {
  margin-bottom: 32px;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.team-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: white;
  border-color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.role-icon {
  font-size: 24px;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #1e293b;
  font-weight: 600;
}

.role-tag {
  border-radius: 20px;
  font-weight: 600;
  padding: 4px 12px;
  font-size: 12px;
  max-width: fit-content;
}

.team-members-section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.add-member-btn {
  border-radius: 50px;
  padding: 10px 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  color: white;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.add-member-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.members-table :deep(.ant-table) {
  border-radius: 16px;
}

.members-table :deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  color: #1e293b;
  padding: 16px;
}

.members-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.members-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc;
}

.join-time {
  color: #64748b;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-start;
}

.edit-role-btn {
  border-radius: 20px;
  padding: 6px 16px;
  font-weight: 600;
  color: #8b5cf6;
  border: 2px solid #e2e8f0;
  background: white;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  height: 32px;
}

.edit-role-btn:hover {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  border-color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.remove-member-btn {
  border-radius: 20px;
  padding: 6px 16px;
  font-weight: 600;
  color: #ef4444;
  border: 2px solid #fecaca;
  background: white;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  height: 32px;
}

.remove-member-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* 模态框样式 */
.edit-team-modal :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border-radius: 16px 16px 0 0;
}

.edit-team-modal :deep(.ant-modal-title) {
  color: white;
  font-weight: 700;
}

.edit-team-content {
  padding: 20px 0;
}

.role-modal :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border-radius: 16px 16px 0 0;
}

.role-modal :deep(.ant-modal-title) {
  color: white;
  font-weight: 700;
}

.role-modal-content {
  padding: 20px 0;
}

.role-modal-text {
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 20px;
  font-weight: 500;
}

.role-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-radio {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.role-radio:hover {
  border-color: #8b5cf6;
  background: #f8fafc;
}

.role-radio.ant-radio-wrapper-checked {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.add-member-modal :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #10b981, #34d399);
  border-radius: 16px 16px 0 0;
}

.add-member-modal :deep(.ant-modal-title) {
  color: white;
  font-weight: 700;
}

.add-member-content {
  padding: 20px 0;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.form-input {
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 16px;
  padding: 0 16px;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.role-description {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.description-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.description-list {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
  line-height: 1.6;
}

.description-list li {
  margin-bottom: 8px;
}

.create-app-modal :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  border-radius: 16px 16px 0 0;
}

.create-app-modal :deep(.ant-modal-title) {
  color: white;
  font-weight: 700;
}

.create-app-content {
  padding: 20px 0;
}

.form-textarea {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 16px;
  padding: 16px;
  transition: all 0.3s ease;
  resize: none;
}

.form-textarea:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.preset-prompts {
  margin-top: 24px;
}

.preset-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.prompt-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.prompt-btn {
  height: auto;
  padding: 16px 20px;
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  background: white;
}

.prompt-btn:hover {
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  background: #f8fafc;
}

.mouse-follower {
  position: fixed;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%);
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

#teamDetailPage:hover .mouse-follower {
  opacity: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .team-detail-container {
    padding: 32px 24px;
    border-radius: 20px;
  }

  .team-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .team-header-right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: 120px;
  }
  
  .team-info {
    grid-template-columns: 1fr;
  }

  .prompt-buttons {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .add-member-btn {
    width: 100%;
  }
}
</style>