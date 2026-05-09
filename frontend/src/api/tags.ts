import client from './client'

export const tagsApi = {
  getAll: () => client.get('/tags').then((r) => r.data),
  create: (name: string) => client.post('/tags', { name }).then((r) => r.data),
  remove: (id: number) => client.delete(`/tags/${id}`).then((r) => r.data),
}
