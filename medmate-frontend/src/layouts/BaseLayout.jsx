// src/layouts/BaseLayout.jsx
import Sidebar from '../components/Sidebar';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const BaseLayout = ({ role, navItems }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen font-inter bg-gray-50">
      <Sidebar navItems={navItems} handleLogout={handleLogout} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default BaseLayout;
