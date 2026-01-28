import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../network/api_client.dart';
import 'auth_repository.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

enum AppRole { doctor, admin, pharmacist, unknown, anonymous }

final authGuardProvider = ChangeNotifierProvider<AuthGuard>((ref) {
  final api = ApiClient(); // uses localhost by default
  return AuthGuard(AuthRepository(api), const FlutterSecureStorage());
});

class AuthGuard extends ChangeNotifier {
  final AuthRepository repo;
  final FlutterSecureStorage storage;
  AppRole role = AppRole.anonymous;
  bool loggedIn = false;
  Map<String, dynamic>? user;

  final GlobalKey<NavigatorState> doctorNavKey = GlobalKey<NavigatorState>();
  final GlobalKey<NavigatorState> adminNavKey = GlobalKey<NavigatorState>();
  final GlobalKey<NavigatorState> pharmacistNavKey =
      GlobalKey<NavigatorState>();

  AuthGuard(this.repo, this.storage);

  Future<void> setTokens(String access, String refresh) async {
    await storage.write(key: 'access_token', value: access);
    await storage.write(key: 'refresh_token', value: refresh);
    await loadProfile();
  }

  Future<void> logout() async {
    await storage.deleteAll();
    role = AppRole.anonymous;
    loggedIn = false;
    notifyListeners();
  }

  Future<void> performLogout(BuildContext context) async {
    await logout();
    if (context.mounted) {
      // Navigate to login and clear navigation stack
      GoRouter.of(context).go('/login');
    }
  }

  Future<void> loadProfile() async {
    try {
      final p = await repo.profile();
      user = p;
      loggedIn = true;
      final r = (p['role'] ?? p['user_role'] ?? '').toString().toLowerCase();
      if (r.contains('admin'))
        role = AppRole.admin;
      else if (r.contains('doctor'))
        role = AppRole.doctor;
      else if (r.contains('pharmacist'))
        role = AppRole.pharmacist;
      else
        role = AppRole.unknown;
    } catch (_) {
      loggedIn = false;
      role = AppRole.anonymous;
      user = null;
    }
    notifyListeners();
  }

  String? redirect(BuildContext context, GoRouterState state) {
    final loc = state.matchedLocation;
    final needsAuth = loc.startsWith('/doctor') ||
        loc.startsWith('/admin') ||
        loc.startsWith('/pharmacist');

    if (!loggedIn && needsAuth) return '/login';

    if (loggedIn && loc == '/login') {
      switch (role) {
        case AppRole.admin:
          return '/admin';
        case AppRole.doctor:
          return '/doctor';
        case AppRole.pharmacist:
          return '/pharmacist';
        default:
          // Don't redirect to '/' if we're already there or if role is unknown
          if (loc != '/' && role != AppRole.unknown) {
            return '/';
          }
          return null;
      }
    }
    return null;
  }
}
