// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 GET /review/${param0}/&#42;&#42; */
export async function serveStaticResource1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.serveStaticResource1Params,
  options?: { [key: string]: any }
) {
  const { deployKey: param0, ...queryParams } = params
  return request<string>(`/review/${param0}/**`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  })
}
