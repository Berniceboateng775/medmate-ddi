import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_guard.dart';

class AdminShell extends StatefulWidget {
  final Widget child;
  const AdminShell({super.key, required this.child});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  String hospitalName = 'Hospital';

  @override
  void initState() {
    super.initState();
    // TODO: Fetch hospital name from user data/API
    // For now, use a placeholder
    hospitalName = 'Hospital';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const _AdminDrawer(),
      appBar: AppBar(title: Text(hospitalName)),
      body: widget.child,
    );
  }
}

class _AdminDrawer extends StatelessWidget {
  const _AdminDrawer();

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: [
            const Padding(
              padding: EdgeInsets.all(12.0),
              child:
                  Text('ADMIN', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            ListTile(
                leading: const Icon(Icons.home),
                title: const Text('Dashboard'),
                onTap: () => context.go('/admin/dashboard')),
            ListTile(
                leading: const Icon(Icons.people),
                title: const Text('Patients'),
                onTap: () => context.go('/admin/patients')),
            ListTile(
                leading: const Icon(Icons.person_add),
                title: const Text('Register Patient'),
                onTap: () => context.go('/admin/register-patient')),
            ListTile(
                leading: const Icon(Icons.person_add),
                title: const Text('Register User'),
                onTap: () => context.go('/admin/register-user')),
            ListTile(
                leading: const Icon(Icons.manage_accounts),
                title: const Text('User Management'),
                onTap: () => context.go('/admin/dashboard')),
            const Divider(),
            ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('Settings'),
                onTap: () => context.go('/admin/settings')),
            Consumer(
              builder: (context, ref, child) => ListTile(
                leading: const Icon(Icons.logout),
                title: const Text('Logout'),
                onTap: () async {
                  final authGuard = ref.read(authGuardProvider);
                  await authGuard.performLogout(context);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
