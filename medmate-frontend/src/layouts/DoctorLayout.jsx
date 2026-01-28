// src/layouts/DoctorLayout.jsx
import BaseLayout from './BaseLayout';

const navItems = [
  {
    label: 'Dashboard',
    path: '/doctor',
    icon: (
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7m7-7v10a1 1 0 01-1 1h-3" />
      </svg>
    ),
  },
  {
    label: 'Patients',
    path: '/doctor/patients',
    icon: (
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M12 20.612v-4.238m0 0a4 4 0 01-4-4v-1.262a4 4 0 014-4 4 4 0 014 4v1.262a4 4 0 01-4 4z" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    path: '/doctor/notifications',
    icon: (
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/doctor/profile',
    icon: (
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '/doctor/settings',
    icon: (
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.983 3.001c-.3 0-.593.032-.878.09l-.73-1.356a1 1 0 10-1.74.988l.73 1.356a8.977 8.977 0 00-1.876.905L5.165 3.49a1 1 0 00-1.33 1.495l1.624 1.624a8.977 8.977 0 00-.905 1.876l-1.356-.73a1 1 0 10-.988 1.74l1.356.73c-.058.285-.09.578-.09.878s.032.593.09.878l1.356.73a1 1 0 10.988 1.74l1.356-.73c.219.661.522 1.287.905 1.876l-1.624 1.624a1 1 0 001.495 1.33l1.624-1.624c.589.383 1.215.686 1.876.905l-.73 1.356a1 1 0 001.74.988l.73-1.356c.285.058.578.09.878.09s.593-.032.878-.09l.73 1.356a1 1 0 001.74-.988l-.73-1.356a8.977 8.977 0 001.876-.905l1.624 1.624a1 1 0 001.495-1.33l-1.624-1.624c.383-.589.686-1.215.905-1.876l1.356.73a1 1 0 10.988-1.74l-1.356-.73c.058-.285.09-.578.09-.878s-.032-.593-.09-.878l1.356-.73a1 1 0 10-.988-1.74l-1.356.73a8.935 8.935 0 00-.878-.09zM12 15a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
    highlight: true,
  },
];

const DoctorLayout = () => {
  return <BaseLayout role="doctor" navItems={navItems} />;
};

export default DoctorLayout;
