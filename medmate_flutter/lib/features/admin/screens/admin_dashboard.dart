import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  Map<String, dynamic>? dashboardData;
  List<dynamic> users = [];
  bool loading = true;
  bool usersLoading = false;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
    _loadUsers();
  }

  Future<void> _loadDashboard() async {
    try {
      final api = ApiClient();
      final response = await api.dio.get('/api/admin/dashboard/');
      setState(() => dashboardData = response.data);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _loadUsers() async {
    setState(() => usersLoading = true);
    try {
      final api = ApiClient();
      final response = await api.dio.get('/api/admin/users/');
      setState(() => users = response.data['users'] ?? []);
    } catch (e) {
      _showSnackBar('Failed to load users', Colors.red);
    } finally {
      setState(() => usersLoading = false);
    }
  }

  Future<void> _handleUserAction(int userId, String action) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirm Action'),
        content: Text('Are you sure you want to $action this user?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final api = ApiClient();
      final response = await api.dio.post('/api/admin/users/$userId/$action/');
      _showSnackBar(response.data['message'], Colors.green);
      _loadUsers();
    } catch (e) {
      _showSnackBar('Failed to $action user', Colors.red);
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin Dashboard')),
        body: Center(child: Text('Error: $error')),
      );
    }

    final metrics = dashboardData?['metrics'] ?? {};
    final ddiChecks7d = dashboardData?['ddi_checks_7d'] ?? [];
    final recentUsers = dashboardData?['recent_users'] ?? [];
    final recentDdiChecks = dashboardData?['recent_ddi_checks'] ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Dashboard')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Admin Dashboard',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Metrics Cards
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildMetricCard(
                    'Users', metrics['users']?.toString() ?? '0', Icons.people),
                _buildMetricCard(
                    'New Sign-ups (7d)',
                    metrics['new_signups_7d']?.toString() ?? '0',
                    Icons.person_add),
                _buildMetricCard(
                    'DDI Checks (24h)',
                    metrics['ddi_checks_24h']?.toString() ?? '0',
                    Icons.analytics),
                _buildMetricCard(
                    'Error Rate (24h)',
                    '${metrics['error_rate_24h']?.toString() ?? '0'}%',
                    Icons.error),
              ],
            ),
            const SizedBox(height: 24),

            // User Management Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'User Management',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        ElevatedButton(
                          onPressed: usersLoading ? null : _loadUsers,
                          child: Text(usersLoading ? 'Loading...' : 'Refresh'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (users.isEmpty && !usersLoading)
                      const Center(
                          child: Text('No users found in your hospital'))
                    else
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columns: const [
                            DataColumn(label: Text('Name')),
                            DataColumn(label: Text('Email')),
                            DataColumn(label: Text('Role')),
                            DataColumn(label: Text('Status')),
                            DataColumn(label: Text('Actions')),
                          ],
                          rows: users.map<DataRow>((user) {
                            return DataRow(cells: [
                              DataCell(
                                  Text(user['full_name'] ?? user['email'])),
                              DataCell(Text(user['email'])),
                              DataCell(Text(user['role'])),
                              DataCell(
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: user['is_active']
                                        ? Colors.green
                                        : Colors.red,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    user['is_active'] ? 'Active' : 'Inactive',
                                    style: const TextStyle(
                                        color: Colors.white, fontSize: 12),
                                  ),
                                ),
                              ),
                              DataCell(
                                Row(
                                  children: [
                                    TextButton(
                                      onPressed: () => _handleUserAction(
                                        user['id'],
                                        user['is_active']
                                            ? 'deactivate'
                                            : 'activate',
                                      ),
                                      child: Text(
                                        user['is_active']
                                            ? 'Deactivate'
                                            : 'Activate',
                                        style: TextStyle(
                                          color: user['is_active']
                                              ? Colors.red
                                              : Colors.green,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () => _handleUserAction(
                                          user['id'], 'reset_password'),
                                      child: const Text(
                                        'Reset Password',
                                        style: TextStyle(
                                            color: Colors.orange, fontSize: 12),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ]);
                          }).toList(),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: Theme.of(context).primaryColor),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
