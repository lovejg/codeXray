import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import ProblemsPage from './pages/ProblemsPage'
import ProblemDetailPage from './pages/ProblemDetailPage'
// ProblemFormPage는 관리자 전용이므로 일반 라우트에서 제외
import SolutionsPage from './pages/SolutionsPage'
import SolutionFormPage from './pages/SolutionFormPage'
import CommunityPage from './pages/CommunityPage'
import CommunityPostPage from './pages/CommunityPostPage'
import CommunityFormPage from './pages/CommunityFormPage'
import SuggestionsPage from './pages/SuggestionsPage'
import SuggestionFormPage from './pages/SuggestionFormPage'
import SuggestionPostPage from './pages/SuggestionPostPage'
import NotesPage from './pages/NotesPage'
import ProfilePage from './pages/ProfilePage'
import MyProblemsPage from './pages/MyProblemsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import AdminReportsPage from './pages/AdminReportsPage'
import BookmarkletPage from './pages/BookmarkletPage'
import NotificationsPage from './pages/NotificationsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<ProblemsPage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/my-problems" element={<MyProblemsPage />} />
            <Route path="/problems/:id" element={<ProblemDetailPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />
            <Route path="/solutions/new" element={<SolutionFormPage />} />
            <Route path="/solutions/:id/edit" element={<SolutionFormPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/new" element={<CommunityFormPage />} />
            <Route path="/community/:id" element={<CommunityPostPage />} />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/suggestions/new" element={<SuggestionFormPage />} />
            <Route path="/suggestions/:id" element={<SuggestionPostPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/import" element={<BookmarkletPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
