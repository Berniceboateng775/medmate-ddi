import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_guard.dart';
import '../../core/network/api_client.dart';
import '../../core/auth/auth_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final totpCode = TextEditingController();
  bool loading = false;
  String? error;
  bool requires2FA = false;
  int? userId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header
              Container(
                clipBehavior: Clip.hardEdge, // overflow-hidden
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    // from-slate-900 via-slate-800 to-emerald-900
                    colors: [
                      Color(0xFF0F172A), // slate-900
                      Color(0xFF1F2937), // slate-800
                      Color(0xFF064E3B), // emerald-900
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.local_pharmacy,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'MedMate',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () => GoRouter.of(context).go('/'),
                          child: const Text(
                            'Home',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Centered "AI-Powered Analysis"
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(0xFF34D399).withOpacity(0.3),
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.science,
                                color: Color(0xFF10B981), size: 16),
                            SizedBox(width: 6),
                            Text(
                              'AI-Powered Analysis',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Centered "Healthcare Provider Login"
                    const Center(
                      child: Text(
                        'Healthcare Provider\nLogin',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          height: 1.2,
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Centered subtitle
                    Center(
                      child: Text(
                        'Secure access for medical professionals.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.grey[300],
                          fontSize: 16,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Main Content
              Padding(
                padding: const EdgeInsets.all(20),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 400),
                    child: Column(
                      children: [
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.security,
                            color: Color(0xFF10B981),
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Healthcare Provider Access',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Secure login for medical professionals to access patient drug interaction analysis.',
                          style: TextStyle(
                            color: Colors.grey[600],
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 32),

                        // Login Form
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // Email Field
                              TextField(
                                controller: email,
                                decoration: InputDecoration(
                                  labelText: 'Email Address',
                                  hintText: 'doctor@hospital.com',
                                  prefixIcon: const Icon(Icons.email),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  filled: true,
                                  fillColor: Colors.grey[50],
                                ),
                                keyboardType: TextInputType.emailAddress,
                              ),
                              const SizedBox(height: 16),

                              // Password Field
                              TextField(
                                controller: password,
                                decoration: InputDecoration(
                                  labelText: 'Password',
                                  hintText: '••••••••••••',
                                  prefixIcon: const Icon(Icons.lock),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  filled: true,
                                  fillColor: Colors.grey[50],
                                ),
                                obscureText: true,
                              ),
                              const SizedBox(height: 16),

                              // 2FA Code Field
                              if (requires2FA)
                                TextField(
                                  controller: totpCode,
                                  decoration: InputDecoration(
                                    labelText: '2FA Code',
                                    hintText: 'Enter code from email',
                                    prefixIcon: const Icon(Icons.security),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    filled: true,
                                    fillColor: Colors.grey[50],
                                  ),
                                  keyboardType: TextInputType.number,
                                  maxLength: 6,
                                ),

                              const SizedBox(height: 24),

                              // Error Message
                              if (error != null)
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.red[50],
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.red[200]!),
                                  ),
                                  child: Text(
                                    error!,
                                    style: const TextStyle(color: Colors.red),
                                  ),
                                ),

                              const SizedBox(height: 16),

                              // Login Button
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: loading
                                      ? null
                                      : () async {
                                          setState(() {
                                            loading = true;
                                            error = null;
                                          });
                                          try {
                                            final api = ApiClient();
                                            final repo = AuthRepository(api);
                                            final data = await repo.login(
                                              email.text.trim(),
                                              password.text,
                                              totpCode: requires2FA
                                                  ? totpCode.text
                                                  : null,
                                            );
                                            if (data.containsKey(
                                                    'requires_2fa') &&
                                                data['requires_2fa'] == true) {
                                              setState(() {
                                                requires2FA = true;
                                                userId = data['user_id'];
                                                loading = false;
                                              });
                                              return;
                                            }
                                            final access =
                                                data['access'] as String?;
                                            final refresh =
                                                data['refresh'] as String?;
                                            if (access == null ||
                                                refresh == null) {
                                              throw Exception(
                                                  'Bad token response: missing access or refresh token');
                                            }
                                            await ref
                                                .read(authGuardProvider)
                                                .setTokens(access, refresh);
                                            setState(() {
                                              requires2FA = false;
                                              userId = null;
                                            });
                                          } catch (e) {
                                            setState(() => error =
                                                'Login failed: ${e.toString()}');
                                          } finally {
                                            if (mounted && !requires2FA)
                                              setState(() => loading = false);
                                          }
                                        },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10B981),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: Text(loading
                                      ? 'Authenticating...'
                                      : requires2FA
                                          ? 'Verify 2FA'
                                          : 'Access Dashboard'),
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Passkey Button
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                            'Passkey login coming soon on mobile.'),
                                      ),
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 16),
                                    side: BorderSide(color: Colors.grey[300]!),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.key),
                                      SizedBox(width: 8),
                                      Text('Use Passkey'),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Footer Text
                        Text(
                          'Protected by enterprise-grade security',
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 12,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Footer
              Container(
                padding: const EdgeInsets.all(16),
                color: Colors.grey[900],
                child: Center(
                  child: Text(
                    '© ${DateTime.now().year} MedMate. Healthcare technology you can trust.',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
