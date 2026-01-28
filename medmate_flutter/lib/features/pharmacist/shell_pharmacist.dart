import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_guard.dart';

class PharmacistShell extends StatefulWidget {
  final Widget child;
  const PharmacistShell({super.key, required this.child});

  @override
  State<PharmacistShell> createState() => _PharmacistShellState();
}

class _PharmacistShellState extends State<PharmacistShell> {
  String hospitalName = 'Hospital';

  @override
  void initState() {
    super.initState();
    // TODO: Fetch hospital name from user data/API
    hospitalName = 'Hospital';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const _PharmacistDrawer(),
      appBar: AppBar(title: Text(hospitalName)),
      body: widget.child,
    );
  }
}

class _PharmacistDrawer extends StatelessWidget {
  const _PharmacistDrawer();

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: [
            const Padding(
              padding: EdgeInsets.all(12.0),
              child: Text('PHARMACIST',
                  style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            ListTile(
                leading: const Icon(Icons.home),
                title: const Text('Dashboard'),
                onTap: () => context.go('/pharmacist/dashboard')),
            ListTile(
                leading: const Icon(Icons.people),
                title: const Text('Patients'),
                onTap: () => context.go('/pharmacist/patients')),
            ListTile(
                leading: const Icon(Icons.person),
                title: const Text('Profile'),
                onTap: () => context.go('/pharmacist/profile')),
            const Divider(),
            ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('Settings'),
                onTap: () => context.go('/pharmacist/settings')),
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
