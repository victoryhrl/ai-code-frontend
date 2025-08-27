<template>
  <div id="userLoginPage">
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
      <div class="login-form-container">
        <div class="login-header">
          <div class="logo">
            <img src="@/assets/logo.png" alt="AI应用生成平台" class="logo-img">
          </div>
          <h2 class="title">AI 应用生成平台</h2>
          <div class="desc">不写一行代码，生成完整应用</div>
        </div>
        
        <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
          <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
            <a-input v-model:value="formState.userAccount" placeholder="请输入账号" class="login-input" />
          </a-form-item>
          <a-form-item
            name="userPassword"
            :rules="[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码长度不能小于 8 位' },
            ]"
          >
            <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" class="login-input" />
          </a-form-item>
          <div class="tips">
            没有账号
            <RouterLink to="/user/register">去注册</RouterLink>
          </div>
          <a-form-item>
            <a-button type="primary" html-type="submit" class="login-button">登录</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import { userLogin } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})

const router = useRouter()
const loginUserStore = useLoginUserStore()

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  const res = await userLogin(values)
  // 登录成功，把登录态保存到全局状态中
  if (res.data.code === 0 && res.data.data) {
    await loginUserStore.fetchLoginUser()
    message.success('登录成功')
    router.push({
      path: '/',
      replace: true,
    })
  } else {
    message.error('登录失败，' + res.data.message)
  }
}
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#userLoginPage {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #1e293b;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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
  max-width: 480px;
  width: 100%;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

/* 登录表单容器 */
.login-form-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  transition: all 0.3s ease;
}

.login-form-container:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
}

/* 登录头部 */
.login-header {
  margin-bottom: 40px;
}

/* Logo */
.logo {
  margin-bottom: 24px;
}

.logo-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 12px;
}

/* 标题 */
.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 16px;
  color: #1e293b;
}

/* 描述 */
.desc {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

/* 输入框 */
.login-input {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  height: 48px;
  padding: 0 16px !important;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.7) !important;
}

.login-input:hover {
  border-color: #94a3b8 !important;
}

.login-input:focus-within {
  border-color: #8b5cf6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.ant-form-item {
  margin-bottom: 24px;
}

/* 提示信息 */
.tips {
  text-align: right;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 28px;
}

.tips a {
  color: #8b5cf6;
  text-decoration: none;
  transition: color 0.3s ease;
}

.tips a:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.login-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-form-container {
    padding: 32px 24px;
    margin: 20px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .desc {
    font-size: 14px;
  }
  
  .shape-1 {
    width: 300px;
    height: 300px;
  }
  
  .shape-2 {
    width: 250px;
    height: 250px;
  }
  
  .shape-3 {
    width: 150px;
    height: 150px;
  }
}
</style>
