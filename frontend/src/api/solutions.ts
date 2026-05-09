import client from './client'

export const solutionsApi = {
  getAll: (starred?: boolean) =>
    client.get('/solutions', { params: starred !== undefined ? { starred } : {} }).then((r) => r.data),

  getOne: (id: number) => client.get(`/solutions/${id}`).then((r) => r.data),

  create: (data: { problemId: number; code: string; language?: string }) =>
    client.post('/solutions', data).then((r) => r.data),

  update: (id: number, data: { code?: string; language?: string; starred?: boolean }) =>
    client.put(`/solutions/${id}`, data).then((r) => r.data),

  toggleStar: (id: number) => client.patch(`/solutions/${id}/star`).then((r) => r.data),

  upsertMemo: (id: number, data: { wrongReason?: string; logic?: string; keyFunctions?: string; freeNote?: string }) =>
    client.put(`/solutions/${id}/memo`, data).then((r) => r.data),

  remove: (id: number) => client.delete(`/solutions/${id}`).then((r) => r.data),
}
