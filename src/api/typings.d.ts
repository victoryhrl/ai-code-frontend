declare namespace API {
  type AppAddRequest = {
    initPrompt?: string
  }

  type AppAdminUpdateRequest = {
    id?: number
    appName?: string
    cover?: string
    priority?: number
  }

  type AppDeployRequest = {
    appId?: number
  }

  type AppQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    appName?: string
    cover?: string
    initPrompt?: string
    codeGenType?: string
    deployKey?: string
    priority?: number
    userId?: number
  }

  type AppUpdateRequest = {
    id?: number
    appName?: string
  }

  type AppVO = {
    id?: number
    appName?: string
    cover?: string
    initPrompt?: string
    codeGenType?: string
    deployKey?: string
    deployedTime?: string
    priority?: number
    userId?: number
    createTime?: string
    updateTime?: string
    user?: UserVO
  }

  type BaseResponseAppVO = {
    code?: number
    data?: AppVO
    message?: string
  }

  type BaseResponseBoolean = {
    code?: number
    data?: boolean
    message?: string
  }

  type BaseResponseListFileNode = {
    code?: number
    data?: FileNode[]
    message?: string
  }

  type BaseResponseListTeamUserVO = {
    code?: number
    data?: TeamUserVO[]
    message?: string
  }

  type BaseResponseLoginUserVO = {
    code?: number
    data?: LoginUserVO
    message?: string
  }

  type BaseResponseLong = {
    code?: number
    data?: number
    message?: string
  }

  type BaseResponseMapStringObject = {
    code?: number
    data?: Record<string, any>
    message?: string
  }

  type BaseResponsePageAppVO = {
    code?: number
    data?: PageAppVO
    message?: string
  }

  type BaseResponsePageChatHistory = {
    code?: number
    data?: PageChatHistory
    message?: string
  }

  type BaseResponsePageTeam = {
    code?: number
    data?: PageTeam
    message?: string
  }

  type BaseResponsePageTeamVO = {
    code?: number
    data?: PageTeamVO
    message?: string
  }

  type BaseResponsePageUser = {
    code?: number
    data?: PageUser
    message?: string
  }

  type BaseResponsePageUserVO = {
    code?: number
    data?: PageUserVO
    message?: string
  }

  type BaseResponseString = {
    code?: number
    data?: string
    message?: string
  }

  type BaseResponseTeamUser = {
    code?: number
    data?: TeamUser
    message?: string
  }

  type BaseResponseTeamVO = {
    code?: number
    data?: TeamVO
    message?: string
  }

  type BaseResponseUser = {
    code?: number
    data?: User
    message?: string
  }

  type BaseResponseUserVO = {
    code?: number
    data?: UserVO
    message?: string
  }

  type ChatHistory = {
    id?: number
    message?: string
    messageType?: string
    appId?: number
    userId?: number
    createTime?: string
    updateTime?: string
    isDelete?: number
  }

  type ChatHistoryQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    message?: string
    messageType?: string
    appId?: number
    userId?: number
    lastCreateTime?: string
  }

  type chatToGenCodeParams = {
    appId: number
    message: string
    isDeep: boolean
  }

  type DeleteRequest = {
    id?: number
  }

  type downloadAppCodeParams = {
    appId: number
  }

  type executeWorkflowWithFluxParams = {
    workflowRequest: WorkflowRequest
  }

  type executeWorkflowWithSseParams = {
    workflowRequest: WorkflowRequest
  }

  type FileNode = {
    title?: string
    key?: string
    isLeaf?: boolean
  }

  type getAppCodeContentParams = {
    appId: number
    filePath: string
  }

  type getAppVOByIdByAdminParams = {
    id: number
  }

  type getAppVOByIdParams = {
    id: number
  }

  type getBuildStatusParams = {
    appId: number
  }

  type getFileTreeParams = {
    appId: number
  }

  type getTeamUserVOByIdParams = {
    teamId: number
  }

  type getTeamVOByIdParams = {
    id: number
  }

  type getUserByIdParams = {
    id: number
  }

  type getUserVOByIdParams = {
    id: number
  }

  type IllustrationTask = {
    query?: string
  }

  type ImageCollectionPlan = {
    contentImageTasks?: ImageSearchTask[]
    illustrationTasks?: IllustrationTask[]
  }

  type ImageResource = {
    category?: 'CONTENT' | 'LOGO' | 'ILLUSTRATION' | 'ARCHITECTURE'
    description?: string
    url?: string
  }

  type ImageSearchTask = {
    query?: string
  }

  type listAppChatHistoryParams = {
    appId: number
    pageSize?: number
    lastCreateTime?: string
  }

  type LoginUserVO = {
    id?: number
    userName?: string
    userAvatar?: string
    userProfile?: string
    userAccount?: string
    userRole?: string
    createTime?: string
    updateTime?: string
  }

  type OrderItem = {
    column?: string
    asc?: boolean
  }

  type PageAppVO = {
    records?: AppVO[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageAppVO
    searchCount?: PageAppVO
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type PageChatHistory = {
    records?: ChatHistory[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageChatHistory
    searchCount?: PageChatHistory
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type PageTeam = {
    records?: Team[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageTeam
    searchCount?: PageTeam
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type PageTeamVO = {
    records?: TeamVO[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageTeamVO
    searchCount?: PageTeamVO
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type PageUser = {
    records?: User[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageUser
    searchCount?: PageUser
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type PageUserVO = {
    records?: UserVO[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageUserVO
    searchCount?: PageUserVO
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type QualityResult = {
    isValid?: boolean
    errors?: string[]
    suggestions?: string[]
  }

  type ServerSentEventString = true

  type serveStaticResource1Params = {
    deployKey: string
  }

  type serveStaticResourceParams = {
    deployKey: string
  }

  type SseEmitter = {
    timeout?: number
  }

  type Team = {
    id?: number
    teamName?: string
    appId?: number
    maxSize?: number
    userId?: number
    createTime?: string
    editTime?: string
    updateTime?: string
    isDelete?: number
  }

  type TeamAddRequest = {
    teamName?: string
  }

  type teamChatToGenCodeParams = {
    appId: number
    teamId: number
    message: string
    isDeep: boolean
  }

  type TeamCreateAppRequest = {
    id?: number
    prompt?: string
  }

  type TeamEditRequest = {
    id?: number
    teamName?: string
  }

  type TeamQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    teamName?: string
    appId?: number
    userId?: number
  }

  type TeamUpdateRequest = {
    id?: number
    teamName?: string
  }

  type TeamUser = {
    id?: number
    teamId?: number
    userId?: number
    teamRole?: string
    createTime?: string
    updateTime?: string
  }

  type TeamUserAddRequest = {
    teamId?: number
    userId?: number
    teamRole?: string
  }

  type TeamUserEditRequest = {
    id?: number
    teamRole?: string
  }

  type TeamUserQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    teamId?: number
    userId?: number
    teamRole?: string
  }

  type TeamUserVO = {
    id?: number
    teamId?: number
    userId?: number
    teamRole?: string
    createTime?: string
    updateTime?: string
    userVO?: UserVO
    teamVO?: TeamVO
  }

  type TeamVO = {
    id?: number
    teamName?: string
    appId?: number
    maxSize?: number
    userId?: number
    createTime?: string
    editTime?: string
    updateTime?: string
    user?: UserVO
  }

  type UpdateAppCodeRequest = {
    appId?: number
    filePath?: string
    content?: string
  }

  type User = {
    id?: number
    userAccount?: string
    userPassword?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    editTime?: string
    createTime?: string
    updateTime?: string
    isDelete?: number
  }

  type UserAddRequest = {
    userName?: string
    userAccount?: string
    userAvatar?: string
    userRole?: string
  }

  type UserLoginRequest = {
    userAccount?: string
    userPassword?: string
  }

  type UserQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    userName?: string
    userProfile?: string
    userRole?: string
  }

  type UserRegisterRequest = {
    userAccount?: string
    userPassword?: string
    checkPassword?: string
  }

  type UserUpdateMyRequest = {
    userName?: string
    userAvatar?: string
    userProfile?: string
  }

  type UserUpdateRequest = {
    id?: number
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
  }

  type UserVO = {
    id?: number
    userName?: string
    userAccount?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    createTime?: string
  }

  type WorkflowContext = {
    currentStep?: string
    originalPrompt?: string
    imageListStr?: string
    imageList?: ImageResource[]
    enhancedPrompt?: string
    generationType?: 'HTML' | 'MULTI_FILE' | 'VUE_PROJECT'
    qualityResult?: QualityResult
    generatedCodeDir?: string
    buildResultDir?: string
    errorMessage?: string
    imageCollectionPlan?: ImageCollectionPlan
    contentImages?: ImageResource[]
    illustrations?: ImageResource[]
  }

  type WorkflowRequest = {
    prompt?: string
    appId?: number
    isDeep?: boolean
  }
}
