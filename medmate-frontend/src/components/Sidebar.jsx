// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import colors from '../constants/colors';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ navItems = [], handleLogout, role = 'ADMIN' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hospitalName, setHospitalName] = useState('Hospital');

  useEffect(() => {
    // Get hospital name from user data
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Hospital name is now included directly in the user object from login response
        const hospital = user.hospital || 'Hospital';
        setHospitalName(hospital);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setHospitalName('Hospital');
      }
    }
  }, []);

  const isActive = (path) => {
    // exact match for base sections, prefix match for nested routes
    if (path === '/admin' || path === '/doctor' || path === '/pharmacist') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-gray-800 text-white p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide mb-2 text-gray-400">
          {role}
        </div>

        {/* hospital name with inline color (no dynamic Tailwind class) */}
        <div
          className="text-xl font-bold mb-8 text-center"
          style={{ color: colors.primaryGreen }}
        >
          {hospitalName}
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, path, icon, highlight }) => {
            const active = isActive(path);
            const base = 'flex items-center px-4 py-3 rounded-lg w-full text-left transition-colors duration-200';

            // Use inline style only when you need custom hex colors
            const style = highlight ? { backgroundColor: colors.primaryGreen } : undefined;

            const classes = active
              ? `${base} bg-gray-700`
              : `${base} hover:bg-gray-700`;

            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={classes}
                style={style}
                aria-current={active ? 'page' : undefined}
              >
                {/* icon box so various icon sizes align */}
                <span className="h-5 w-5 flex items-center justify-center">{icon}</span>
                <span className="ml-3">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 flex items-center px-4 py-3 rounded-lg w-full text-left transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Logout
      </button>
    </aside>
  );
}
