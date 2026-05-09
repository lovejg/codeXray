import client from './client'

export const bookmarksApi = {
  getAll: () => client.get('/bookmarks').then((r) => r.data),
  getIds: () => client.get('/bookmarks/ids').then((r) => r.data as number[]),
  toggle: (problemId: number) => client.post(`/bookmarks/${problemId}`).then((r) => r.data),
}
