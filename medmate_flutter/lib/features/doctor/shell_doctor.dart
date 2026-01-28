import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_guard.dart';

class DoctorShell extends StatefulWidget {
  final Widget child;
  const DoctorShell({super.key, required this.child});

  @override
  State<DoctorShell> createState() => _DoctorShellState();
}

class _DoctorShellState extends State<DoctorShell> {
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
      drawer: const _DoctorDrawer(),
      appBar: AppBar(title: Text(hospitalName)),
      body: widget.child,
    );
  }
}

class _DoctorDrawer extends StatelessWidget {
  const _DoctorDrawer();

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
                  Text('DOCTOR', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            ListTile(
                leading: const Icon(Icons.home),
                title: const Text('Dashboard'),
                onTap: () => context.go('/doctor/dashboard')),
            ListTile(
                leading: const Icon(Icons.people),
                title: const Text('Patients'),
                onTap: () => context.go('/doctor/patients')),
            ListTile(
                leading: const Icon(Icons.notifications),
                title: const Text('Notifications'),
                onTap: () => context.go('/doctor/notifications')),
            ListTile(
                leading: const Icon(Icons.person),
                title: const Text('Profile'),
                onTap: () => context.go('/doctor/profile')),
            const Divider(),
            ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('Settings'),
                onTap: () => context.go('/doctor/settings')),
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
