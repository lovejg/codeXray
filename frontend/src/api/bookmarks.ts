import client from './client'
import type { Bookmark } from '../types'

export const bookmarksApi = {
  getAll: (): Promise<Bookmark[]> => client.get('/bookmarks').then((r) => r.data),
  getIds: (): Promise<number[]> => client.get('/bookmarks/ids').then((r) => r.data as number[]),
  toggle: (problemId: number): Promise<{ bookmarked: boolean }> =>
    client.post(`/bookmarks/${problemId}`).then((r) => r.data),
}
