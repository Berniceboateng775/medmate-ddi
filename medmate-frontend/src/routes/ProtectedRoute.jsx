// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ role }) {
  const location = useLocation();

  const token = localStorage.getItem('access') || '';
  const raw = localStorage.getItem('user');
  let user = null;
  try { user = raw ? JSON.parse(raw) : null; } catch { user = null; }

  // must be logged in
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // normalize roles to UPPERCASE for comparison
  const current = (user.role || '').toUpperCase();
  const required = (role || '').toUpperCase();

  // SUPERUSER can access ADMIN area; others strict
  const allowedFor = {
    ADMIN: ['ADMIN', 'SUPERUSER'],
    DOCTOR: ['DOCTOR'],
    PHARMACIST: ['PHARMACIST'],
    '': ['ADMIN', 'SUPERUSER', 'DOCTOR', 'PHARMACIST'], // if no role prop, any logged-in user
  };

  const allowed = (allowedFor[required] || allowedFor['']).includes(current);

  if (!allowed) {
    // Send them to their own dashboard (map UPPERCASE role → valid path)
    const roleToPath = {
      SUPERUSER: '/admin',
      ADMIN: '/admin',
      DOCTOR: '/doctor',
      PHARMACIST: '/pharmacist',
    };
    return <Navigate to={roleToPath[current] || '/'} replace />;
  }

  // IMPORTANT: render nested routes/layouts
  return <Outlet />;
}
