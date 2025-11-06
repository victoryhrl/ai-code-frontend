<template>
    <div id="teamManagePage">
      <!-- 搜索表单 -->
      <a-form layout="inline" :model="searchParams" @finish="doSearch">
        <a-form-item label="团队名称">
          <a-input v-model:value="searchParams.teamName" placeholder="输入团队名称" />
        </a-form-item>
        <a-form-item label="创建者ID">
          <a-input v-model:value="searchParams.userId" placeholder="输入创建者ID" />
        </a-form-item>
        <a-form-item label="应用ID">
          <a-input v-model:value="searchParams.appId" placeholder="输入应用ID" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">搜索</a-button>
        </a-form-item>
      </a-form>
      <a-divider />
      
      <!-- 表格 -->
      <a-table
        :columns="columns"
        :data-source="data"
        :pagination="pagination"
        @change="doTableChange"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.dataIndex === 'updateTime'">
            {{ record.updateTime ? dayjs(record.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'isDelete'">
            <a-tag :color="record.isDelete === 0 ? 'green' : 'red'">
              {{ record.isDelete === 0 ? '正常' : '已删除' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button 
                type="link" 
                size="small" 
                @click="viewTeamDetail(record.id)"
              >
                查看详情
              </a-button>
              <a-button 
                danger 
                size="small" 
                @click="doDelete(record.id)"
                :disabled="record.isDelete === 1"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { listTeamByPage, deleteTeam } from '@/api/teamController'
  import { message, Modal } from 'ant-design-vue'
  import dayjs from 'dayjs'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '团队名称',
      dataIndex: 'teamName',
      width: 150,
    },
    {
      title: '应用ID',
      dataIndex: 'appId',
      width: 100,
    },
    {
      title: '最大成员数',
      dataIndex: 'maxSize',
      width: 100,
    },
    {
      title: '创建者ID',
      dataIndex: 'userId',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'isDelete',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
    },
  ]
  
  // 展示的数据
  const data = ref<API.Team[]>([])
  const total = ref(0)
  
  // 搜索条件
  const searchParams = reactive<API.TeamQueryRequest>({
    current: 1,
    pageSize: 10,
    sortField: 'createTime',
    sortOrder: 'descend'   
  })
  
  // 获取数据
  const fetchData = async () => {
    try {
      const res = await listTeamByPage({
        ...searchParams,
      })
      if (res.data.data) {
        data.value = res.data.data.records ?? []
        total.value = res.data.data.total ?? 0
      } else {
        message.error('获取数据失败，' + res.data.message)
      }
    } catch (error) {
      console.error('获取团队数据失败：', error)
      message.error('获取数据失败，请重试')
    }
  }
  
  // 分页参数
  const pagination = computed(() => {
    return {
      current: searchParams.current ?? 1,
      pageSize: searchParams.pageSize ?? 10,
      total: total.value,
      showSizeChanger: true,
      showTotal: (total: number) => `共 ${total} 条`,
    }
  })
  
  // 表格分页变化时的操作
  const doTableChange = (page: { current: number; pageSize: number }) => {
    searchParams.current = page.current
    searchParams.pageSize = page.pageSize
    fetchData()
  }
  
  // 搜索数据
  const doSearch = () => {
    // 重置页码
    searchParams.current = 1
    fetchData()
  }
  
  // 查看团队详情
  const viewTeamDetail = (teamId: number) => {
    if (teamId) {
      router.push(`/team/detail/${teamId}`)
    }
  }
  
  // 删除数据
  const doDelete = async (id: number) => {
    if (!id) {
      return
    }
    
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个团队吗？删除后无法恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await deleteTeam({ id })
          if (res.data.code === 0) {
            message.success('删除成功')
            // 刷新数据
            fetchData()
          } else {
            message.error('删除失败：' + res.data.message)
          }
        } catch (error) {
          console.error('删除团队失败：', error)
          message.error('删除失败，请重试')
        }
      },
    })
  }
  
  // 页面加载时请求一次
  onMounted(() => {
    fetchData()
  })
  </script>
  
  <style scoped>
  /* 全局样式 */
  #teamManagePage {
    padding: 32px;
    background: white;
    margin: 16px 20px;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #1e293b;
  }
  
  /* 表格样式优化 */
  :deep(.ant-table-tbody > tr > td) {
    vertical-align: middle;
  }
  
  :deep(.ant-table) {
    border-radius: 16px;
    overflow: hidden;
  }
  
  :deep(.ant-table-thead > tr > th) {
    background-color: #f8fafc !important;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
    color: #475569;
  }
  
  :deep(.ant-table-tbody > tr:hover > td) {
    background-color: #f8fafc !important;
  }
  
  /* 按钮样式优化 */
  :deep(.ant-btn-primary) {
    background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
    border: none;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  :deep(.ant-btn-primary:hover) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  }
  
  :deep(.ant-btn-danger) {
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  :deep(.ant-btn-danger:hover) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
  
  :deep(.ant-btn-link) {
    border-radius: 8px;
    transition: all 0.3s ease;
    color: #8b5cf6;
  }
  
  :deep(.ant-btn-link:hover) {
    color: #7c3aed;
    background-color: #f8fafc;
    transform: translateY(-1px);
  }
  
  /* 输入框样式优化 */
  :deep(.ant-input),
  :deep(.ant-select-selector) {
    border-radius: 8px !important;
    border: 1px solid #e2e8f0 !important;
    transition: all 0.3s ease !important;
  }
  
  :deep(.ant-input:hover),
  :deep(.ant-select-selector:hover) {
    border-color: #94a3b8 !important;
  }
  
  :deep(.ant-input:focus),
  :deep(.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector) {
    border-color: #8b5cf6 !important;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
  }
  
  /* 标签样式优化 */
  :deep(.ant-tag) {
    border-radius: 6px;
    padding: 2px 8px;
    font-weight: 500;
  }
  
  /* 分割线样式 */
  :deep(.ant-divider) {
    margin: 20px 0;
    border-color: #f1f5f9;
  }
  
  /* 表格滚动条样式 */
  :deep(.ant-table-body) {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  :deep(.ant-table-body)::-webkit-scrollbar {
    height: 8px;
  }
  
  :deep(.ant-table-body)::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  :deep(.ant-table-body)::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  :deep(.ant-table-body)::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  /* 响应式调整 */
  @media (max-width: 768px) {
    #teamManagePage {
      padding: 20px;
      margin: 8px 10px;
    }
    
    :deep(.ant-form-inline .ant-form-item) {
      margin-bottom: 16px;
    }
    
    :deep(.ant-table) {
      font-size: 14px;
    }
  }
  </style>