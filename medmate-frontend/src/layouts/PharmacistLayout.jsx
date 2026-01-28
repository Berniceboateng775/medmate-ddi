// src/layouts/PharmacistLayout.jsx
import BaseLayout from './BaseLayout';

const navItems = [
  {
    label: 'Dashboard',
    path: '/pharmacist',
    icon: (
      <svg
        className="h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7m7-7v10a1 1 0 01-1 1h-3" />
      </svg>
    ),
  },
  {
    label: 'Patients',
    path: '/pharmacist/patients',
    icon: (
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M12 20.612v-4.238m0 0a4 4 0 01-4-4v-1.262a4 4 0 014-4 4 4 0 014 4v1.262a4 4 0 01-4 4z" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/pharmacist/profile',
    icon: (
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
  label: 'Settings',
  path: '/pharmacist/settings',
  icon: (
    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.983 3.001c-.3 0-.593.032-.878.09l... [full path as above]" />
    </svg>
  ),
  highlight: true,
}
];

const PharmacistLayout = () => {
  return <BaseLayout role="pharmacist" navItems={navItems} />;
};

export default PharmacistLayout;
