import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_client.dart';
import '../../core/auth/auth_guard.dart';

class TwoFactorSetupScreen extends ConsumerStatefulWidget {
  const TwoFactorSetupScreen({super.key});

  @override
  ConsumerState<TwoFactorSetupScreen> createState() =>
      _TwoFactorSetupScreenState();
}

class _TwoFactorSetupScreenState extends ConsumerState<TwoFactorSetupScreen> {
  final _api = ApiClient();
  final _codeCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _toggle2FA() async {
    final user = ref.read(authGuardProvider).user;
    final isEnabled = user?['email_2fa_enabled'] ?? false;
    final action = isEnabled ? 'disable' : 'enable';

    setState(() => _loading = true);
    try {
      final data = {'action': action};
      if (action == 'disable') {
        data['code'] = _codeCtrl.text;
      }
      await _api.dio.post('/api/auth/2fa/setup/', data: data);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('2FA ${action}d successfully')),
      );
      // Refresh user profile
      await ref.read(authGuardProvider).loadProfile();
      if (action == 'disable') {
        context.pop();
      } else {
        setState(() {});
      }
    } catch (e) {
      setState(() => _error = e.toString());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authGuardProvider).user;
    final isEnabled = user?['email_2fa_enabled'] ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(isEnabled ? 'Disable 2FA' : 'Enable 2FA')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(isEnabled
                ? 'Disable two-factor authentication. You will need to enter a code sent to your email.'
                : 'Enable two-factor authentication for enhanced security.'),
            const SizedBox(height: 16),
            if (isEnabled)
              TextField(
                controller: _codeCtrl,
                decoration: const InputDecoration(
                  labelText: 'Enter 6-digit code from your email',
                ),
                keyboardType: TextInputType.number,
                maxLength: 6,
              ),
            const SizedBox(height: 16),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Text(
                  'Error: $_error',
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loading ? null : _toggle2FA,
              child: _loading
                  ? const CircularProgressIndicator()
                  : Text(isEnabled ? 'Disable 2FA' : 'Enable 2FA'),
            ),
          ],
        ),
      ),
    );
  }
}
