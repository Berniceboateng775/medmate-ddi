// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Landing from "./pages/Landing"
import Login from "./pages/Login"
import AnonymousChecker from "./pages/AnonymousChecker"
import VerifyEmail from "./pages/VerifyEmail"
import AcceptInvite from "./pages/AcceptInvite"

import ProtectedRoute from "./routes/ProtectedRoute"

// Layouts
import AdminLayout from "./layouts/AdminLayout"
import DoctorLayout from "./layouts/DoctorLayout"
import PharmacistLayout from "./layouts/PharmacistLayout"

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard"
import RegisterUser from "./pages/RegisterUser"
import AdminSettings from "./pages/AdminSettings"
import AdminRegisterPatient from "./pages/AdminRegisterPatient"
import AdminPatients from "./pages/AdminPatients"
import AdminPatientDetail from "./pages/AdminPatientDetail"
import AdminPatientEdit from "./pages/AdminPatientEdit" // Added import for AdminPatientEdit

// Doctor Pages
import DoctorDashboard from "./pages/DoctorDashboard"
import DoctorPatients from "./pages/DoctorPatients"
import PatientDetail from "./pages/PatientDetail"
import RegisterPatient from "./pages/RegisterPatient"
import DoctorProfile from "./pages/DoctorProfile"
import DoctorSettings from "./pages/DoctorSettings"
import Notifications from "./pages/Notifications"

// Pharmacist Pages
import PharmacistDashboard from "./pages/PharmacistDashboard"
import PharmacistPatients from "./pages/PharmacistPatients"
import PharmacistPatientDetail from "./pages/PharmacistPatientDetail"
import PharmacistProfile from "./pages/PharmacistProfile"
import PharmacistSettings from "./pages/PharmacistSettings"
import TwoFactorSetup from "./pages/TwoFactorSetup"
import AddNewPatient from "./pages/AddNewPatient"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/anonymous-checker" element={<AnonymousChecker />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/invite/:code" element={<AcceptInvite />} />

        {/* Legacy redirects / compatibility */}
        <Route path="/register-user" element={<Navigate to="/admin/register-user" replace />} />
        <Route path="/DoctorPatients" element={<Navigate to="/doctor/patients" replace />} />
        <Route path="/doctor/DoctorPatients" element={<Navigate to="/doctor/patients" replace />} />

        {/* ADMIN section */}
        <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="2fa-setup" element={<TwoFactorSetup />} />
            <Route path="register-user" element={<RegisterUser />} />
            <Route path="register-patient" element={<AdminRegisterPatient />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="patient/:id" element={<AdminPatientDetail />} />
            <Route path="patient/:id/edit" element={<AdminPatientEdit />} /> // Added edit route for patients
          </Route>
        </Route>

        {/* DOCTOR section */}
        <Route path="/doctor" element={<ProtectedRoute role="DOCTOR" />}>
          <Route element={<DoctorLayout />}>
            <Route index element={<DoctorDashboard />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patient/:id" element={<PatientDetail />} />
            <Route path="register-patient" element={<RegisterPatient />} />
            <Route path="profile" element={<DoctorProfile />} />
            <Route path="settings" element={<DoctorSettings />} />
            <Route path="2fa-setup" element={<TwoFactorSetup />} />
            <Route path="notifications" element={<Notifications />} />
            {/* Nested legacy redirect (just in case) */}
            <Route path="DoctorPatients" element={<Navigate to="patients" replace />} />
          </Route>
        </Route>

        {/* PHARMACIST section */}
        <Route path="/pharmacist" element={<ProtectedRoute role="PHARMACIST" />}>
          <Route element={<PharmacistLayout />}>
            <Route index element={<PharmacistDashboard />} />
            <Route path="patients" element={<PharmacistPatients />} />
            <Route path="patient/:id" element={<PharmacistPatientDetail />} />
            <Route path="profile" element={<PharmacistProfile />} />
            <Route path="settings" element={<PharmacistSettings />} />
            <Route path="2fa-setup" element={<TwoFactorSetup />} />
            <Route path="add-patient" element={<AddNewPatient />} />
          </Route>
        </Route>

        {/* Optional 404 */}
        {/* <Route path="*" element={<div style={{padding:24}}>Not found</div>} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
