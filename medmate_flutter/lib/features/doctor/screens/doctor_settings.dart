import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_guard.dart';

class DoctorSettings extends ConsumerWidget {
  const DoctorSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authGuardProvider).user;
    final is2FAEnabled = user?['email_2fa_enabled'] ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Doctor Settings',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            Card(
              child: ListTile(
                leading: const Icon(Icons.notifications),
                title: const Text('Notification Preferences'),
                subtitle: const Text('Manage how you receive notifications'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // TODO: Implement notification settings
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Notification settings coming soon')),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                leading: const Icon(Icons.security),
                title: const Text('Disable Two-Factor Authentication'),
                subtitle: const Text('2FA is currently enabled'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/2fa-setup'),
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                leading: const Icon(Icons.palette),
                title: const Text('Appearance'),
                subtitle: const Text('Theme and display preferences'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // TODO: Implement appearance settings
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Appearance settings coming soon')),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
