import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/doctor/screens/doctor_patient_detail.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/two_factor_setup_screen.dart';
import '../features/landing/landing_screen.dart';
import '../features/anonymous/anonymous_checker_screen.dart';
import '../features/doctor/shell_doctor.dart';
import '../features/doctor/screens/doctor_dashboard.dart';
import '../features/doctor/screens/doctor_patients.dart';
import '../features/doctor/screens/doctor_register_patient.dart';
import '../features/doctor/screens/doctor_notifications.dart';
import '../features/doctor/screens/doctor_profile.dart';
import '../features/doctor/screens/doctor_settings.dart';
import '../features/admin/shell_admin.dart';
import '../features/admin/screens/admin_dashboard.dart';
import '../features/admin/screens/admin_register_user.dart';
import '../features/admin/screens/admin_settings.dart';
import '../features/admin/screens/admin_patients.dart';
import '../features/admin/screens/admin_register_patient.dart';
import '../features/pharmacist/shell_pharmacist.dart';
import '../features/pharmacist/screens/pharmacist_dashboard.dart';
import '../features/pharmacist/screens/pharmacist_patients.dart';
import '../features/pharmacist/screens/pharmacist_patient_detail.dart';
import '../features/pharmacist/screens/pharmacist_profile.dart';
import '../features/pharmacist/screens/pharmacist_settings.dart';
import '../core/auth/auth_guard.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final guard = ref.read(authGuardProvider);
  return GoRouter(
    initialLocation: '/',
    refreshListenable: guard,
    routes: [
      GoRoute(path: '/', builder: (c, s) => const LandingScreen()),
      GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
      GoRoute(
          path: '/2fa-setup', builder: (c, s) => const TwoFactorSetupScreen()),
      GoRoute(
          path: '/anonymous-checker',
          builder: (c, s) => const AnonymousCheckerScreen()),

      // Doctor area with drawer shell
      ShellRoute(
        navigatorKey: guard.doctorNavKey,
        builder: (c, s, child) => DoctorShell(child: child),
        routes: [
          GoRoute(path: '/doctor', builder: (c, s) => const DoctorDashboard()),
          GoRoute(
              path: '/doctor/dashboard',
              builder: (c, s) => const DoctorDashboard()),
          GoRoute(
              path: '/doctor/patients',
              builder: (c, s) => const DoctorPatients()),
          GoRoute(
              path: '/doctor/register-patient',
              builder: (c, s) => const DoctorRegisterPatient()),
          GoRoute(
              path: '/doctor/notifications',
              builder: (c, s) => const DoctorNotifications()),
          GoRoute(
              path: '/doctor/profile',
              builder: (c, s) => const DoctorProfile()),
          GoRoute(
              path: '/doctor/settings',
              builder: (c, s) => const DoctorSettings()),
          GoRoute(
              path: '/doctor/patient/:id',
              builder: (c, s) =>
                  DoctorPatientDetail(id: s.pathParameters['id']!))
        ],
      ),

      // Admin area with drawer shell
      ShellRoute(
        navigatorKey: guard.adminNavKey,
        builder: (c, s, child) => AdminShell(child: child),
        routes: [
          GoRoute(path: '/admin', builder: (c, s) => const AdminDashboard()),
          GoRoute(
              path: '/admin/dashboard',
              builder: (c, s) => const AdminDashboard()),
          GoRoute(
              path: '/admin/patients',
              builder: (c, s) => const AdminPatients()),
          GoRoute(
              path: '/admin/register-patient',
              builder: (c, s) => const AdminRegisterPatient()),
          GoRoute(
              path: '/admin/register-user',
              builder: (c, s) => const AdminRegisterUser()),
          GoRoute(
              path: '/admin/settings',
              builder: (c, s) => const AdminSettings()),
        ],
      ),

      // Pharmacist area with drawer shell
      ShellRoute(
        navigatorKey: guard.pharmacistNavKey,
        builder: (c, s, child) => PharmacistShell(child: child),
        routes: [
          GoRoute(
              path: '/pharmacist',
              builder: (c, s) => const PharmacistDashboard()),
          GoRoute(
              path: '/pharmacist/dashboard',
              builder: (c, s) => const PharmacistDashboard()),
          GoRoute(
              path: '/pharmacist/patients',
              builder: (c, s) => const PharmacistPatients()),
          GoRoute(
              path: '/pharmacist/patient/:id',
              builder: (c, s) =>
                  PharmacistPatientDetail(id: s.pathParameters['id']!)),
          GoRoute(
              path: '/pharmacist/profile',
              builder: (c, s) => const PharmacistProfile()),
          GoRoute(
              path: '/pharmacist/settings',
              builder: (c, s) => const PharmacistSettings()),
        ],
      ),
    ],
    redirect: guard.redirect,
  );
});
