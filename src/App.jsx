import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/admin/Login';
import Dashboard from '@/pages/admin/Dashboard';
import SurveyEditor from '@/pages/admin/SurveyEditor';
import SurveyResults from '@/pages/admin/SurveyResults';
import PublicSurvey from '@/pages/public/PublicSurvey';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Verificando...</div>;
  return user ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Público */}
          <Route path="/survey/:slug" element={<PublicSurvey />} />

          {/* Admin */}
          <Route path="/admin/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/surveys/new" element={<SurveyEditor />} />
            <Route path="/admin/surveys/:id" element={<SurveyEditor />} />
            <Route path="/admin/surveys/:id/results" element={<SurveyResults />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}