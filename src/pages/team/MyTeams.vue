<template>
  <div id="myTeamsPage">
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
      <div class="teams-container">
        <div class="teams-header">
          <h2 class="title">我的团队</h2>
          <div class="subtitle">查看和管理您已加入的团队</div>
          <div class="header-actions">
            <a-button type="primary" @click="goToCreateTeam" class="create-btn">
              <PlusOutlined /> 创建新团队
            </a-button>
          </div>
        </div>
        
        <div class="teams-content">
          <a-spin :spinning="loading">
            <div v-if="teams.length > 0" class="teams-grid">
              <div v-for="team in teams" :key="team.id" class="team-card">
                <div class="team-card-header">
                  <h3 class="team-name">{{ team.teamVO?.teamName }}</h3>
                  <div class="team-status">
                    <span class="status-dot"></span>
                    <span class="status-text">活跃</span>
                  </div>
                </div>
                
                <div class="team-card-content">
                  <div class="team-info">
                    <div class="info-item">
                      <UserOutlined class="info-icon" />
                      <span>创建者: {{ team.teamVO?.userId || '未知' }}</span>
                    </div>
                    <div class="info-item">
                      <CalendarOutlined class="info-icon" />
                      <span>创建时间: {{ formatDate(team.createTime) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="team-card-actions">
                  <a-button type="link" @click="viewTeamDetail(String(team.teamId))" class="action-btn">
                    <EyeOutlined /> 查看详情
                  </a-button>
                </div>
              </div>
            </div>
            
            <div v-else-if="!loading" class="empty-teams">
              <div class="empty-content">
                <div class="empty-icon">👥</div>
                <h3 class="empty-title">您还没有加入任何团队</h3>
                <p class="empty-description">创建或加入团队，开始协作开发</p>
                <a-button type="primary" @click="goToCreateTeam" class="empty-action-btn">创建新团队</a-button>
              </div>
            </div>
            
            <!-- 分页组件 -->
            <div v-if="teams.length > 0" class="pagination-container">
              <a-pagination
                v-model:current="pagination.current"
                :total="pagination.total"
                :pageSize="pagination.pageSize"
                :showSizeChanger="true"
                :pageSizeOptions="['6', '12', '24']"
                :showTotal="(total : any) => `共 ${total} 个团队`"
                @change="handlePageChange"
                @showSizeChange="handleSizeChange"
              />
            </div>
          </a-spin>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { 
  PlusOutlined, 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { listMyTeamTeam } from '@/api/teamUserController'

const router = useRouter()
const loginUserStore = useLoginUserStore()

// 团队数据
const teams = ref<API.TeamUserVO[]>([])
const loading = ref(false)

// 分页数据
const pagination = reactive({
  current: 1,
  pageSize: 6,
  total: 0,
})

// 获取团队列表
const fetchTeams = async () => {
  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    await router.push('/user/login')
    return
  }

  loading.value = true
  try {
    const res = await listMyTeamTeam({
      current: pagination.current,
      pageSize: pagination.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
    })
    console.log('获取团队列表响应', res)
    if (res.data.code === 0 && res.data.data) {
      teams.value = res.data.data || []
      pagination.total = res.data.data.length || 0
    } else {
      message.error('获取团队列表失败：' + res.data.message)
    }
  } catch (error) {
    console.error('获取团队列表失败：', error)
    message.error('获取团队列表失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handlePageChange = (page: number) => {
  pagination.current = page
  fetchTeams()
}

// 处理每页条数变化
const handleSizeChange = (current: number, size: number) => {
  pagination.current = 1
  pagination.pageSize = size
  fetchTeams()
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

// 前往创建团队页面
const goToCreateTeam = () => {
  router.push('/team/create')
}

// 查看团队详情
const viewTeamDetail = (teamId?: string) => {
  if (!teamId) return
  router.push(`/team/detail/${teamId}`)
}

// 页面加载时获取团队列表
onMounted(() => {
  fetchTeams()
})
</script>

<style scoped>
#myTeamsPage {
  position: relative;
  min-height: calc(100vh - 64px);
  padding: 40px 0;
  overflow: hidden;
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

.teams-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 48px;
  margin: 60px auto;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.teams-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48px;
  text-align: center;
}

.title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 18px;
  color: #64748b;
  font-weight: 400;
  margin-bottom: 24px;
}

.header-actions {
  margin-top: 16px;
}

.create-btn {
  border-radius: 50px;
  padding: 12px 32px;
  font-weight: 600;
  font-size: 16px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.teams-content {
  margin-top: 20px;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.team-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 24px;
  transition: all 0.3s ease;
  border: 1px solid rgba(139, 92, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.team-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
}

.team-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.2);
}

.team-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.team-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #10b981, #34d399);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.team-card-content {
  margin-bottom: 20px;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.info-icon {
  color: #8b5cf6;
  font-size: 16px;
}

.team-card-actions {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.action-btn {
  border-radius: 20px;
  padding: 8px 20px;
  font-weight: 600;
  color: #8b5cf6;
  border: 2px solid #e2e8f0;
  background: white;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  border-color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.empty-teams {
  padding: 80px 0;
  text-align: center;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.empty-description {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.6;
}

.empty-action-btn {
  border-radius: 50px;
  padding: 12px 32px;
  font-weight: 600;
  font-size: 16px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  transition: all 0.3s ease;
}

.empty-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.pagination-container {
  margin-top: 40px;
  text-align: center;
}

.pagination-container :deep(.ant-pagination) {
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination-container :deep(.ant-pagination .ant-pagination-item) {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  margin: 0 4px;
}

.pagination-container :deep(.ant-pagination .ant-pagination-item-active) {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border-color: #8b5cf6;
}

.pagination-container :deep(.ant-pagination .ant-pagination-item-active a) {
  color: white;
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

#myTeamsPage:hover .mouse-follower {
  opacity: 1;
}

@media (max-width: 767px) {
  .teams-container {
    padding: 32px 24px;
    margin: 40px auto;
    border-radius: 20px;
  }
  
  .title {
    font-size: 28px;
  }
  
  .subtitle {
    font-size: 16px;
  }
  
  .teams-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .team-card {
    padding: 20px;
  }

  .team-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .team-status {
    align-self: flex-end;
  }
}
</style>