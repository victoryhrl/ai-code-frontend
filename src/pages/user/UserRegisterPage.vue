<template>
  <div id="userRegisterPage">
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
      <div class="register-form-container">
        <div class="register-header">
          <div class="logo">
            <img src="@/assets/logo.png" alt="AI应用生成平台" class="logo-img">
          </div>
          <h2 class="title">AI 应用生成平台</h2>
          <div class="desc">不写一行代码，生成完整应用</div>
        </div>
        
        <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
          <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
            <a-input v-model:value="formState.userAccount" placeholder="请输入账号" class="custom-input" />
          </a-form-item>
          <a-form-item
            name="userPassword"
            :rules="[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码不能小于 8 位' },
            ]"
          >
            <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" class="custom-input" />
          </a-form-item>
          <a-form-item
            name="checkPassword"
            :rules="[
              { required: true, message: '请确认密码' },
              { min: 8, message: '密码不能小于 8 位' },
              { validator: validateCheckPassword },
            ]"
          >
            <a-input-password v-model:value="formState.checkPassword" placeholder="请确认密码" class="custom-input" />
          </a-form-item>
          <div class="tips">
            已有账号？
            <RouterLink to="/user/login">去登录</RouterLink>
          </div>
          <a-form-item>
            <a-button type="primary" html-type="submit" class="custom-button primary-button">注册</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { userRegister } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import { reactive } from 'vue'

const router = useRouter()

const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

/**
 * 验证确认密码
 * @param rule
 * @param value
 * @param callback
 */
const validateCheckPassword = (rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value && value !== formState.userPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: API.UserRegisterRequest) => {
  const res = await userRegister(values)
  // 注册成功，跳转到登录页面
  if (res.data.code === 0) {
    message.success('注册成功')
    router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    message.error('注册失败，' + res.data.message)
  }
}
</script>

<style scoped>
/* 全局样式 */
#userRegisterPage {
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

/* 注册表单容器 */
.register-form-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.register-form-container:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
}

/* 注册头部 */
.register-header {
  margin-bottom: 32px;
}

/* Logo */
.logo {
  margin-bottom: 20px;
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
  margin: 0 0 12px;
  color: #1e293b;
}

/* 描述 */
.desc {
  font-size: 16px;
  color: #64748b;
  margin: 0 0 24px;
}

/* 自定义输入框样式 */
.custom-input {
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  font-size: 16px !important;
  height: 48px !important;
  transition: all 0.3s ease !important;
  background: rgba(255, 255, 255, 0.7) !important;
}

.custom-input:focus {
  border-color: #8b5cf6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* 提示信息 */
.tips {
  text-align: right;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 24px;
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

/* 自定义按钮样式 */
.custom-button {
  width: 100%;
  height: 48px !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.primary-button {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa) !important;
  border: none !important;
  color: white !important;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px -8px rgba(59, 130, 246, 0.3) !important;
  background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
}

.primary-button:active {
  transform: translateY(0) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-form-container {
    padding: 32px 24px;
    margin: 20px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .desc {
    font-size: 14px;
  }
}
</style>
