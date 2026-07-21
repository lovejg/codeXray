import client from './client'
import type { Solution } from '../types'

export const solutionsApi = {
  getAll: (starred?: boolean): Promise<Solution[]> =>
    client.get('/solutions', { params: starred !== undefined ? { starred } : {} }).then((r) => r.data),

  getOne: (id: number): Promise<Solution> => client.get(`/solutions/${id}`).then((r) => r.data),

  create: (data: { problemId: number; code: string; language?: string }): Promise<Solution> =>
    client.post('/solutions', data).then((r) => r.data),

  update: (id: number, data: { code?: string; language?: string; starred?: boolean }): Promise<Solution> =>
    client.put(`/solutions/${id}`, data).then((r) => r.data),

  toggleStar: (id: number): Promise<Solution> => client.patch(`/solutions/${id}/star`).then((r) => r.data),

  upsertMemo: (id: number, data: { wrongReason?: string; logic?: string; keyFunctions?: string; freeNote?: string }): Promise<Solution> =>
    client.put(`/solutions/${id}/memo`, data).then((r) => r.data),

  remove: (id: number): Promise<void> => client.delete(`/solutions/${id}`).then((r) => r.data),
}
