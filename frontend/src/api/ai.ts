import client from './client'

export type AiTaskType = 'optimize' | 'explain'

export const aiApi = {
  analyze: (data: { code: string; task: AiTaskType; language?: string; problemTitle?: string }) =>
    client.post('/ai/analyze', data).then((r) => r.data),
}
