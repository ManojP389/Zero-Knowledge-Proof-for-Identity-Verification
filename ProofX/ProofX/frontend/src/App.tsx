import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import { getRole, onAuthChange } from './api';
import AuthPage from './pages/AuthPage';
import CompanyRequirements from './pages/CompanyRequirements';
import NotificationsPage from './pages/NotificationsPage';
import ProfileQR from './pages/ProfileQR';
import QRScannerPage from './pages/QRScannerPage';
import UploadDashboard from './pages/UploadDashboard';
import VerificationResultPage from './pages/VerificationResultPage';
import VerifyLandingPage from './pages/VerifyLandingPage';

function HomeRedirect() {
  const role = getRole();
  if (role === 'company') {
    return <Navigate to="/company/requirements" replace />;
  }
  if (role === 'user') {
    return <Navigate to="/user/upload" replace />;
  }
  return <Navigate to="/auth" replace />;
}

function App() {
  const [, setVersion] = useState(0);

  useEffect(() => onAuthChange(() => setVersion((value) => value + 1)), []);

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify" element={<VerifyLandingPage />} />

      <Route element={<ProtectedRoute role="user" />}>
        <Route element={<AppShell />}>
          <Route path="/user/upload" element={<UploadDashboard />} />
          <Route path="/user/profile" element={<ProfileQR />} />
          <Route path="/user/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="company" />}>
        <Route element={<AppShell />}>
          <Route path="/company/requirements" element={<CompanyRequirements />} />
          <Route path="/company/scan" element={<QRScannerPage />} />
          <Route path="/company/result" element={<VerificationResultPage />} />
        </Route>
      </Route>

      <Route path="*" element={<div className="p-8 text-center text-slate-700">Page not found</div>} />
    </Routes>
  );
}

export default App;
