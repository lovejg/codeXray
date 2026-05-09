import client from './client'
import type { ProblemSource } from '../types'

export interface ProblemsPage {
  items: any[]
  total: number
  page: number
  pageSize: number
}

export const problemsApi = {
  getAll: (params?: {
    search?: string
    source?: ProblemSource
    tierMin?: number
    tierMax?: number
    tagId?: number
    sortBy?: string
    order?: string
    page?: number
    pageSize?: number
  }): Promise<ProblemsPage> => client.get('/problems', { params }).then((r) => r.data),

  getOne: (id: number) => client.get(`/problems/${id}`).then((r) => r.data),

  create: (data: {
    title: string
    source: ProblemSource
    level: number
    link: string
    tagIds?: number[]
  }) => client.post('/problems', data).then((r) => r.data),

  update: (id: number, data: Partial<{ title: string; source: ProblemSource; level: number; link: string; tagIds: number[] }>) =>
    client.put(`/problems/${id}`, data).then((r) => r.data),

  remove: (id: number) => client.delete(`/problems/${id}`).then((r) => r.data),
}
