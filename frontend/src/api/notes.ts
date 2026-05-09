import client from './client'
import type { Note, NoteType } from '../types'

export const notesApi = {
  getAll: (params?: { type?: NoteType; search?: string }): Promise<Note[]> =>
    client.get('/notes', { params }).then((r) => r.data),
  getOne: (id: number): Promise<Note> => client.get(`/notes/${id}`).then((r) => r.data),
  create: (data: { type: NoteType; title: string; body: string; language?: string; tags?: string[] }): Promise<Note> =>
    client.post('/notes', data).then((r) => r.data),
  update: (id: number, data: Partial<{ type: NoteType; title: string; body: string; language: string; tags: string[] }>): Promise<Note> =>
    client.put(`/notes/${id}`, data).then((r) => r.data),
  remove: (id: number) => client.delete(`/notes/${id}`).then((r) => r.data),
}
