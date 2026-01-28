import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/auth/auth_guard.dart';

class DoctorDashboard extends StatefulWidget {
  const DoctorDashboard({super.key});

  @override
  State<DoctorDashboard> createState() => _DoctorDashboardState();
}

class _DoctorDashboardState extends State<DoctorDashboard> {
  Map<String, dynamic>? stats;
  List<Map<String, dynamic>> trendingDrugs = [];
  bool loading = true;
  String? error;
  bool showProfileDropdown = false;
  bool showSystemSettings = false;
  String theme = 'light'; // light, dark, system

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final api = ApiClient();

      // Load patient count
      final patientsRes = await api.dio.get('/api/patients/');
      final patients = patientsRes.data is List
          ? patientsRes.data
          : patientsRes.data['results'] ?? [];
      final patientCount = patients.length;

      // Load DDI checks count (placeholder - would need backend endpoint)
      final ddiCount = 0;

      // Load trending drugs (placeholder data)
      final trending = [
        {
          'name': 'Metformin',
          'category': 'Antidiabetic',
          'prescriptions': 245,
          'trend': 'up'
        },
        {
          'name': 'Lisinopril',
          'category': 'ACE Inhibitor',
          'prescriptions': 198,
          'trend': 'stable'
        },
        {
          'name': 'Atorvastatin',
          'category': 'Statin',
          'prescriptions': 187,
          'trend': 'up'
        },
        {
          'name': 'Amlodipine',
          'category': 'Calcium Channel Blocker',
          'prescriptions': 156,
          'trend': 'down'
        },
        {
          'name': 'Omeprazole',
          'category': 'PPI',
          'prescriptions': 134,
          'trend': 'stable'
        },
      ];

      setState(() {
        stats = {
          'totalPatients': patientCount,
          'ddiChecksToday': ddiCount,
          'criticalAlerts': 0,
        };
        trendingDrugs = trending;
      });
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  void _showMessage(String message, String type) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: type == 'error'
            ? Colors.red
            : type == 'success'
                ? Colors.green
                : Colors.blue,
      ),
    );
  }

  void _handleThemeChange(String newTheme) {
    setState(() => theme = newTheme);
    _showMessage('Theme changed to $newTheme', 'success');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = theme == 'dark' ||
        (theme == 'system' &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);

    if (loading) {
      return Scaffold(
        backgroundColor: isDark ? Colors.grey[900] : Colors.grey[50],
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (error != null) {
      return Scaffold(
        backgroundColor: isDark ? Colors.grey[900] : Colors.grey[50],
        appBar: AppBar(
          title: const Text('Doctor Dashboard'),
          backgroundColor: isDark ? Colors.grey[800] : Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error',
                  style:
                      TextStyle(color: isDark ? Colors.white : Colors.black)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadDashboardData,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: isDark ? Colors.grey[900] : Colors.grey[50],
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  color: isDark ? Colors.grey[800] : Colors.white,
                  child: Row(
                    children: [
                      // Logo and title
                      Expanded(
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.green[100],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.medical_services,
                                  color: Colors.green),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.blue[100],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text(
                                    'DOCTOR',
                                    style: TextStyle(
                                      color: Colors.blue,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Text(
                                  'Medical Dashboard',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : Colors.black,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // Profile dropdown
                      Consumer(
                        builder: (context, ref, child) {
                          final authGuard = ref.watch(authGuardProvider);
                          return PopupMenuButton<String>(
                            onSelected: (value) {
                              if (value == 'settings') {
                                _showSystemSettings();
                              } else if (value == 'logout') {
                                authGuard.performLogout(context);
                              }
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'settings',
                                child: Row(
                                  children: [
                                    Icon(Icons.settings, size: 16),
                                    SizedBox(width: 8),
                                    Text('System Settings'),
                                  ],
                                ),
                              ),
                              const PopupMenuDivider(),
                              const PopupMenuItem(
                                value: 'logout',
                                child: Row(
                                  children: [
                                    Icon(Icons.logout, size: 16),
                                    SizedBox(width: 8),
                                    Text('Logout'),
                                  ],
                                ),
                              ),
                            ],
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.green[100],
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child:
                                  const Icon(Icons.person, color: Colors.green),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                // Stats Cards
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final crossAxisCount = constraints.maxWidth > 600 ? 3 : 1;
                      return GridView.count(
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildStatCard(
                            'Active Patients',
                            stats?['totalPatients']?.toString() ?? '0',
                            Icons.people,
                            Colors.green,
                            isDark,
                          ),
                          _buildStatCard(
                            'DDI Checks Today',
                            stats?['ddiChecksToday']?.toString() ?? '0',
                            Icons.check_circle,
                            Colors.purple,
                            isDark,
                          ),
                          _buildStatCard(
                            'Critical Alerts',
                            stats?['criticalAlerts']?.toString() ?? '0',
                            Icons.warning,
                            Colors.orange,
                            isDark,
                          ),
                        ],
                      );
                    },
                  ),
                ),

                // Trending Medications
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Card(
                    color: isDark ? Colors.grey[800] : Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Trending Medications',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Most prescribed medications this month',
                            style: TextStyle(
                              color:
                                  isDark ? Colors.grey[300] : Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 16),
                          ...trendingDrugs.map(
                              (drug) => _buildTrendingDrugItem(drug, isDark)),
                        ],
                      ),
                    ),
                  ),
                ),

                // Quick Actions
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Card(
                    color: isDark ? Colors.grey[800] : Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Quick Actions',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Common medical tasks and tools',
                            style: TextStyle(
                              color:
                                  isDark ? Colors.grey[300] : Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 16),
                          GridView.count(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            children: [
                              _buildQuickActionButton(
                                'Drug Interaction Check',
                                Icons.check_circle,
                                Colors.green,
                                () => _showMessage(
                                    'Opening Drug Interaction Check', 'info'),
                                isDark,
                              ),
                              _buildQuickActionButton(
                                'Patient Search',
                                Icons.search,
                                Colors.blue,
                                () => _showMessage(
                                    'Opening Patient Search', 'info'),
                                isDark,
                              ),
                              _buildQuickActionButton(
                                'Write Prescription',
                                Icons.edit,
                                Colors.purple,
                                () => _showMessage(
                                    'Opening Prescription Writer', 'info'),
                                isDark,
                              ),
                              _buildQuickActionButton(
                                'Medical Records',
                                Icons.folder,
                                Colors.orange,
                                () => _showMessage(
                                    'Opening Medical Records', 'info'),
                                isDark,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // System Settings Modal
          if (showSystemSettings) _buildSystemSettingsModal(isDark),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color, bool isDark) {
    return Card(
      color: isDark ? Colors.grey[800] : Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.grey[300] : Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendingDrugItem(Map<String, dynamic> drug, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[700] : Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? Colors.grey[600]! : Colors.grey[200]!,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: Colors.blue,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.medication, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  drug['name'],
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
                Text(
                  drug['category'],
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                drug['prescriptions'].toString(),
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.white : Colors.black,
                ),
              ),
              Text(
                'prescriptions',
                style: TextStyle(
                  fontSize: 10,
                  color: isDark ? Colors.grey[400] : Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
          _buildTrendIcon(drug['trend']),
        ],
      ),
    );
  }

  Widget _buildTrendIcon(String trend) {
    switch (trend) {
      case 'up':
        return const Icon(Icons.trending_up, color: Colors.green, size: 16);
      case 'down':
        return const Icon(Icons.trending_down, color: Colors.red, size: 16);
      default:
        return const Icon(Icons.trending_flat, color: Colors.grey, size: 16);
    }
  }

  Widget _buildQuickActionButton(String title, IconData icon, Color color,
      VoidCallback onTap, bool isDark) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 24),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSystemSettingsModal(bool isDark) {
    return GestureDetector(
      onTap: () => setState(() => showSystemSettings = false),
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: Center(
          child: GestureDetector(
            onTap: () {}, // Prevent closing when tapping modal
            child: Container(
              width: 300,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[800] : Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'System Settings',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Column(
                    children: [
                      _buildThemeOption('☀️ Light Mode', 'light', isDark),
                      _buildThemeOption('🌙 Dark Mode', 'dark', isDark),
                      _buildThemeOption('💻 System Default', 'system', isDark),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () => setState(() => showSystemSettings = false),
                    child: const Text('Close'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildThemeOption(String label, String value, bool isDark) {
    return InkWell(
      onTap: () => _handleThemeChange(value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: theme == value
              ? (isDark ? Colors.blue[900] : Colors.blue[50])
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Text(label,
                style: TextStyle(color: isDark ? Colors.white : Colors.black)),
            if (theme == value) ...[
              const SizedBox(width: 8),
              Icon(Icons.check, color: Colors.blue, size: 16),
            ],
          ],
        ),
      ),
    );
  }

  void _showSystemSettings() {
    setState(() => showSystemSettings = true);
  }
}
