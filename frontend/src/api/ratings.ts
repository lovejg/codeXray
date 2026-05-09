import client from './client'

export const ratingsApi = {
  getMyFeedback: (problemId: number) =>
    client.get(`/ratings/feedback/${problemId}`).then((r) => r.data.feedback),
  submitFeedback: (problemId: number, level: number) =>
    client.post(`/ratings/feedback/${problemId}`, { level }).then((r) => r.data),
}
