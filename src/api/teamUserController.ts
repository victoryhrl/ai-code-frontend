// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /teamUser/add */
export async function addTeamUser(body: API.TeamUserAddRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/teamUser/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /teamUser/delete */
export async function deleteTeamUser(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/teamUser/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /teamUser/edit */
export async function editTeamUser(
  body: API.TeamUserEditRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/teamUser/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /teamUser/get */
export async function getTeamUser(
  body: API.TeamUserQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseTeamUser>('/teamUser/get', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /teamUser/get/teamUserVO */
export async function getTeamUserVoById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTeamUserVOByIdParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListTeamUserVO>('/teamUser/get/teamUserVO', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /teamUser/list */
export async function listTeamUser(
  body: API.TeamUserQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListTeamUserVO>('/teamUser/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /teamUser/list/my */
export async function listMyTeamTeam(options?: { [key: string]: any }) {
  return request<API.BaseResponseListTeamUserVO>('/teamUser/list/my', {
    method: 'POST',
    ...(options || {}),
  })
}
