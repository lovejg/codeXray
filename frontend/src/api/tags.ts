import client from './client'
import type { AlgorithmTag } from '../types'

export const tagsApi = {
  getAll: (): Promise<AlgorithmTag[]> => client.get('/tags').then((r) => r.data),
  create: (name: string): Promise<AlgorithmTag> => client.post('/tags', { name }).then((r) => r.data),
  remove: (id: number): Promise<void> => client.delete(`/tags/${id}`).then((r) => r.data),
}
