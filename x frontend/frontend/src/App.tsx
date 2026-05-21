import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
import UserUpload from './pages/UserUpload';
import UserProfile from './pages/UserProfile';
import UserNotifications from './pages/UserNotifications';
import CompanyRequirements from './pages/CompanyRequirements';
import CompanyScan from './pages/CompanyScan';
import CompanyResult from './pages/CompanyResult';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user/upload" element={<UserUpload />} />
          <Route path="/user/profile" element={<UserProfile />} />
          <Route path="/user/notifications" element={<UserNotifications />} />
          <Route path="/company/requirements" element={<CompanyRequirements />} />
          <Route path="/company/scan" element={<CompanyScan />} />
          <Route path="/company/result" element={<CompanyResult />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
