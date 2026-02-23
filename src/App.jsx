import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/layout/ScrollToTop';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomeRoute from './components/auth/HomeRoute';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import ServicesPage from './pages/ServicesPage';
import QuotePage from './pages/QuotePage';
import ServiceCategoryPage from './pages/ServiceCategoryPage';
import ServiceSubPage from './pages/ServiceSubPage';
import NotFoundPage from './pages/NotFoundPage';
import UploadPage from './pages/UploadPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LguTranscriptionsPage from './pages/LguTranscriptionsPage';
import TranscriptionDetailPage from './pages/TranscriptionDetailPage';
import UserTranscriptionViewPage from './pages/UserTranscriptionViewPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomeRoute><HomePage /></HomeRoute>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/quote" element={<QuotePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/services/:categorySlug" element={<ServiceCategoryPage />} />
          <Route path="/services/:categorySlug/:serviceSlug" element={<ServiceSubPage />} />

          {/* User routes */}
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/transcriptions/:transcriptionId" element={<ProtectedRoute><UserTranscriptionViewPage /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/transcriptions" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <LguTranscriptionsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/transcriptions/:fileId" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TranscriptionDetailPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
