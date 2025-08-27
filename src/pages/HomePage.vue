<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { addApp, listMyAppVoByPage, listGoodAppVoByPage } from '@/api/appController'
import { getDeployUrl } from '@/config/env'
import AppCard from '@/components/AppCard.vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()

// 用户提示词
const userPrompt = ref('')
const creating = ref(false)

// 我的应用数据
const myApps = ref<API.AppVO[]>([])
const myAppsPage = reactive({
  current: 1,
  pageSize: 6,
  total: 0,
})

// 精选应用数据
const featuredApps = ref<API.AppVO[]>([])
const featuredAppsPage = reactive({
  current: 1,
  pageSize: 6,
  total: 0,
})

// 设置提示词
const setPrompt = (prompt: string) => {
  userPrompt.value = prompt
}

// 创建应用
const createApp = async () => {
  if (!userPrompt.value.trim()) {
    message.warning('请输入应用描述')
    return
  }

  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    await router.push('/user/login')
    return
  }

  creating.value = true
  try {
    const res = await addApp({
      initPrompt: userPrompt.value.trim(),
    })

    if (res.data.code === 0 && res.data.data) {
      message.success('应用创建成功')
      // 跳转到对话页面，确保ID是字符串类型
      const appId = String(res.data.data)
      await router.push(`/app/chat/${appId}`)
    } else {
      message.error('创建失败：' + res.data.message)
    }
  } catch (error) {
    console.error('创建应用失败：', error)
    message.error('创建失败，请重试')
  } finally {
    creating.value = false
  }
}

// 加载我的应用
const loadMyApps = async () => {
  if (!loginUserStore.loginUser.id) {
    return
  }

  try {
    const res = await listMyAppVoByPage({
      current: myAppsPage.current,
      pageSize: myAppsPage.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
    })

    if (res.data.code === 0 && res.data.data) {
      myApps.value = res.data.data.records || []
      myAppsPage.total = res.data.data.total || 0
    }
  } catch (error) {
    console.error('加载我的应用失败：', error)
  }
}

// 加载精选应用
const loadFeaturedApps = async () => {
  try {
    const res = await listGoodAppVoByPage({
      current: featuredAppsPage.current,
      pageSize: featuredAppsPage.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
    })

    if (res.data.code === 0 && res.data.data) {
      featuredApps.value = res.data.data.records || []
      featuredAppsPage.total = res.data.data.total || 0
    }
  } catch (error) {
    console.error('加载精选应用失败：', error)
  }
}

// 查看对话
const viewChat = (appId: string | number | undefined) => {
  if (appId) {
    router.push(`/app/chat/${appId}?view=1`)
  }
}

// 查看作品
const viewWork = (app: API.AppVO) => {
  if (app.deployKey) {
    const url = getDeployUrl(app.deployKey)
    console.log(url)
    window.open(url, '_blank')
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadMyApps()
  loadFeaturedApps()

  // 鼠标跟随光效
  const handleMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    const x = (clientX / innerWidth) * 100
    const y = (clientY / innerHeight) * 100

    document.documentElement.style.setProperty('--mouse-x', `${x}%`)
    document.documentElement.style.setProperty('--mouse-y', `${y}%`)
  }

  document.addEventListener('mousemove', handleMouseMove)

  // 清理事件监听器
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
  }
})
</script>

<template>
  <div id="homePage">
    <!-- 背景装饰 -->
    <div class="background-decoration"></div>
    <div class="mouse-follow-effect"></div>

    <div class="container">
      <!-- 英雄区域 -->
      <section class="hero-section">
        <h2 class="hero-title">用 AI 构建你的<br><span class="highlight">专属应用</span></h2>
        <p class="hero-subtitle">只需一句话描述，即可生成完整可用的网站应用</p>
      </section>

      <!-- 用户提示词输入框 -->
      <section class="input-section">
        <a-textarea
          v-model:value="userPrompt"
          placeholder="例如：创建一个现代化的个人博客网站"
          :rows="4"
          :maxlength="1000"
          class="prompt-input"
        />
        <div class="input-actions">
          <a-button type="primary" size="large" @click="createApp" :loading="creating" class="create-btn">
            生成应用
            <template #icon>
              <span>🚀</span>
            </template>
          </a-button>
        </div>
      </section>

      <!-- 快捷按钮 -->
      <section class="quick-actions">
        <a-button
          type="default"
          @click="
            setPrompt(
              '创建一个现代化的个人博客网站，包含文章列表、详情页、分类标签、搜索功能、评论系统和个人简介页面。采用简洁的设计风格，支持响应式布局，文章支持Markdown格式，首页展示最新文章和热门推荐。'
            )
          "
          class="quick-btn"
        >个人博客网站</a-button
        >
        <a-button
          type="default"
          @click="
            setPrompt(
              '设计一个专业的企业官网，包含公司介绍、产品服务展示、新闻资讯、联系我们等页面。采用商务风格的设计，包含轮播图、产品展示卡片、团队介绍、客户案例展示，支持多语言切换和在线客服功能。'
            )
          "
          class="quick-btn"
        >企业官网</a-button
        >
        <a-button
          type="default"
          @click="
            setPrompt(
              '构建一个功能完整的在线商城，包含商品展示、购物车、用户注册登录、订单管理、支付结算等功能。设计现代化的商品卡片布局，支持商品搜索筛选、用户评价、优惠券系统和会员积分功能。'
            )
          "
          class="quick-btn"
        >在线商城</a-button
        >
        <a-button
          type="default"
          @click="
            setPrompt(
              '制作一个精美的作品展示网站，适合设计师、摄影师、艺术家等创作者。包含作品画廊、项目详情页、个人简历、联系方式等模块。采用瀑布流或网格布局展示作品，支持图片放大预览和作品分类筛选。'
            )
          "
          class="quick-btn"
        >作品展示网站</a-button
        >
      </section>

      <!-- 我的作品 -->
      <section class="section my-apps-section" v-if="loginUserStore.loginUser.id">
        <div class="section-header">
          <h2 class="section-title">我的作品</h2>
          <a-button @click="loadMyApps" size="small" class="refresh-btn">
            刷新
          </a-button>
        </div>
        <div class="app-grid">
          <AppCard
            v-for="app in myApps"
            :key="app.id"
            :app="app"
            @view-chat="viewChat"
            @view-work="viewWork"
          />
          <div v-if="myApps.length === 0" class="empty-state">
            <p>你还没有创建任何应用</p>
            <a-button type="primary" @click="() => {}" size="small">立即创建</a-button>
          </div>
        </div>
        <div class="pagination-wrapper" v-if="myApps.length > 0">
          <a-pagination
            v-model:current="myAppsPage.current"
            v-model:page-size="myAppsPage.pageSize"
            :total="myAppsPage.total"
            :show-size-changer="true"
            show-quick-jumper
            :show-total="(total: number) => `共 ${total} 个应用`"
            @change="loadMyApps"
          />
        </div>
      </section>

      <!-- 精选案例 -->
      <section class="section featured-section">
        <div class="section-header">
          <h2 class="section-title">精选案例</h2>
          <a-button @click="loadFeaturedApps" size="small" class="refresh-btn">
            刷新
          </a-button>
        </div>
        <div class="featured-grid">
          <AppCard
            v-for="app in featuredApps"
            :key="app.id"
            :app="app"
            :featured="true"
            @view-chat="viewChat"
            @view-work="viewWork"
          />
        </div>
        <div class="pagination-wrapper" v-if="featuredApps.length > 0">
          <a-pagination
            v-model:current="featuredAppsPage.current"
            v-model:page-size="featuredAppsPage.pageSize"
            :total="featuredAppsPage.total"
            :show-size-changer="true"
            show-quick-jumper
            :show-total="(total: number) => `共 ${total} 个案例`"
            @change="loadFeaturedApps"
          />
        </div>
      </section>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-logo">
          <img src="@/assets/logo.png" alt="AI应用生成平台" class="footer-logo-img">
          <h3 class="footer-logo-text">AI 应用生成平台</h3>
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link">关于我们</a>
          <a href="#" class="footer-link">使用条款</a>
          <a href="#" class="footer-link">隐私政策</a>
          <a href="#" class="footer-link">帮助中心</a>
        </div>
      </div>
      <div class="copyright">
        © 2025 AI应用生成平台. 保留所有权利.
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 全局样式 */
#homePage {
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #1e293b;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(96, 165, 250, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 80% 30%, rgba(139, 92, 246, 0.05) 0%, transparent 25%),
    radial-gradient(circle at 40% 70%, rgba(16, 185, 129, 0.05) 0%, transparent 20%);
  pointer-events: none;
  z-index: 0;
}

/* 鼠标跟随效果 */
.mouse-follow-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(96, 165, 250, 0.1) 0%,
    rgba(139, 92, 246, 0.05) 40%,
    transparent 80%
  );
  pointer-events: none;
  z-index: 0;
  transition: background 0.2s ease-out;
}

/* 容器 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
}

/* 英雄区域 */
.hero-section {
  text-align: center;
  padding: 20px 0 40px; /* 减少上边距 */
  margin-bottom: 40px;
  position: relative;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  margin: 0 0 20px;
  line-height: 1.2;
  color: #1e293b;
}

.highlight {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 18px;
  margin: 0 auto;
  color: #64748b;
  max-width: 600px;
}

/* 输入区域 */
.input-section {
  position: relative;
  margin: 0 auto 40px;
  max-width: 800px;
}

.prompt-input {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  padding: 20px 24px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.prompt-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.input-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.create-btn {
  border-radius: 50px;
  padding: 12px 36px;
  font-weight: 600;
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
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

/* 快捷按钮 */
.quick-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 60px;
  flex-wrap: wrap;
}

.quick-btn {
  border-radius: 50px;
  padding: 10px 24px;
  height: auto;
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
  transition: all 0.3s ease;
  font-weight: 500;
}

.quick-btn:hover {
  background: #f8fafc;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

/* 区域样式 */
.section {
  margin-bottom: 80px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.refresh-btn {
  color: #64748b;
  border: none;
}

.refresh-btn:hover {
  color: #8b5cf6;
  background-color: transparent;
}

/* 我的作品区域 */
.my-apps-section {
  background-color: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* 精选案例区域 */
.featured-section {
  background-color: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* 应用网格 */
.app-grid,
.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  border-radius: 16px;
  background-color: #f8fafc;
  border: 1px dashed #e2e8f0;
  color: #64748b;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 页脚 */
.footer {
  background-color: white;
  padding: 40px 0;
  border-top: 1px solid #e2e8f0;
  margin-top: 80px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.footer-logo-text {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-link {
  color: #64748b;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #8b5cf6;
}

.copyright {
  text-align: center;
  margin-top: 24px;
  color: #94a3b8;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .app-grid,
  .featured-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
    align-items: center;
  }

  .quick-btn {
    width: 100%;
    max-width: 300px;
  }

  .my-apps-section,
  .featured-section {
    padding: 24px 16px;
  }

  .footer-content {
    flex-direction: column;
    gap: 24px;
  }
}
</style>
