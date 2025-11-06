<template>
  <div id="createTeamPage">
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
      <div class="team-container">
        <div class="team-header">
          <h2 class="title">创建团队</h2>
          <div class="subtitle">创建一个新的团队，开始协作</div>
        </div>
        
        <div class="team-content">
          <a-form
            :model="formState"
            name="createTeamForm"
            class="team-form"
            @finish="handleSubmit"
            :rules="rules"
            ref="formRef"
          >
            <a-form-item label="团队名称" name="teamName">
              <a-input 
                v-model:value="formState.teamName" 
                placeholder="请输入团队名称" 
                class="custom-input" 
              />
            </a-form-item>
            
            <div class="form-actions">
              <a-button type="primary" html-type="submit" :loading="submitting" class="submit-btn">创建团队</a-button>
              <a-button @click="handleCancel" class="cancel-btn">取消</a-button>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { addTeam } from '@/api/teamController'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

// 表单数据
const formState = reactive({
  teamName: '',
})

// 表单验证规则
const rules = {
  teamName: [
    { required: true, message: '请输入团队名称', trigger: 'blur' },
    { min: 2, max: 50, message: '团队名称长度在2-50个字符', trigger: 'blur' },
  ],
}

// 提交表单
const handleSubmit = async () => {
  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    await router.push('/user/login')
    return
  }

  submitting.value = true
  try {
    const res = await addTeam({
      teamName: formState.teamName.trim(),
    })

    if (res.data.code === 0 && res.data.data) {
      message.success('团队创建成功')
      // 跳转到我的团队页面
      await router.push('/team/my')
    } else {
      message.error('创建失败：' + res.data.message)
    }
  } catch (error) {
    console.error('创建团队失败：', error)
    message.error('创建失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 取消创建
const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
#createTeamPage {
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

.team-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 48px;
  max-width: 600px;
  margin: 60px auto;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.team-header {
  text-align: center;
  margin-bottom: 48px;
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
}

.team-content {
  margin-top: 20px;
}

.team-form {
  max-width: 100%;
}

.team-form :deep(.ant-form-item-label) {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
}

.custom-input {
  height: 48px;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  font-size: 16px;
  padding: 0 20px;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.custom-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  background: white;
}

.custom-input:hover {
  border-color: #a78bfa;
  background: white;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.submit-btn {
  border-radius: 50px;
  padding: 12px 36px;
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

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.cancel-btn {
  border-radius: 50px;
  padding: 12px 36px;
  font-weight: 600;
  font-size: 16px;
  height: 48px;
  background: white;
  border: 2px solid #e2e8f0;
  color: #64748b;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
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

#createTeamPage:hover .mouse-follower {
  opacity: 1;
}

@media (max-width: 767px) {
  .team-container {
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

  .form-actions {
    flex-direction: column;
    gap: 16px;
  }

  .submit-btn,
  .cancel-btn {
    width: 100%;
  }
}
</style>