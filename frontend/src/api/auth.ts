import client from './client'

export const authApi = {
  register: (data: { email: string; password: string; nickname: string }) =>
    client.post('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    client.post('/auth/login', data).then((r) => r.data),
  verifyEmail: (token: string) =>
    client.post('/auth/verify-email', { token }).then((r) => r.data),
  resendVerification: (email: string) =>
    client.post('/auth/resend-verification', { email }).then((r) => r.data),
  me: () => client.get('/users/me').then((r) => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.patch('/users/me/password', data).then((r) => r.data),
  deleteAccount: (data: { password?: string; confirmNickname?: string }) =>
    client.delete('/users/me', { data }).then((r) => r.data),
  googleLoginUrl: () => '/api/auth/google',
  naverLoginUrl: () => '/api/auth/naver',
}
