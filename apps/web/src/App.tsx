import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { SignInPage } from './pages/public/SignInPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Student Pages
import { LibraryPage } from './pages/student/LibraryPage';
import { DocumentDetailPage } from './pages/student/DocumentDetailPage';

// Faculty Pages
import { FacultyUploadPage } from './pages/faculty/FacultyUploadPage';
import { FacultySubmissionsPage } from './pages/faculty/FacultySubmissionsPage';

// Admin Pages
import { ApprovalsQueuePage } from './pages/admin/ApprovalsQueuePage';
import { DocumentManagementPage } from './pages/admin/DocumentManagementPage';
import { AcademicHierarchyPage } from './pages/admin/AcademicHierarchyPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Shared Routes (Student, Faculty, Admin) */}
            <Route
              path="/library"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
                  <LibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library/:id"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
                  <DocumentDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Faculty Routes */}
            <Route
              path="/faculty/upload"
              element={
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <FacultyUploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/submissions"
              element={
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <FacultySubmissionsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/approvals"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ApprovalsQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DocumentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academic"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AcademicHierarchyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
export default App;
