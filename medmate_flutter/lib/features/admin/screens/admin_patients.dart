import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';

class Patient {
  final int id;
  final String? patientId;
  final String fullName;
  final String? dob;
  final String? gender;
  final String? phone;
  final String? email;

  Patient({
    required this.id,
    this.patientId,
    required this.fullName,
    this.dob,
    this.gender,
    this.phone,
    this.email,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'],
      patientId: json['patient_id'],
      fullName: json['full_name'] ?? 'Unnamed Patient',
      dob: json['dob'],
      gender: json['gender'],
      phone: json['phone'],
      email: json['email'],
    );
  }
}

class AdminPatients extends ConsumerStatefulWidget {
  const AdminPatients({super.key});

  @override
  ConsumerState<AdminPatients> createState() => _AdminPatientsState();
}

class _AdminPatientsState extends ConsumerState<AdminPatients> {
  List<Patient> patients = [];
  List<Patient> filteredPatients = [];
  bool loading = true;
  String? error;
  String searchQuery = '';
  Patient? patientToDelete;

  @override
  void initState() {
    super.initState();
    _loadPatients();
  }

  Future<void> _loadPatients() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final api = ApiClient();
      final response = await api.dio.get('/api/patients/');
      final data = response.data;
      final patientList =
          data is List ? data : (data['results'] as List?) ?? [];

      setState(() {
        patients = patientList.map((json) => Patient.fromJson(json)).toList();
        _filterPatients();
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load patients: $e';
      });
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  void _filterPatients() {
    if (searchQuery.isEmpty) {
      filteredPatients = patients;
    } else {
      final query = searchQuery.toLowerCase();
      filteredPatients = patients.where((patient) {
        return (patient.fullName.toLowerCase().contains(query)) ||
            (patient.patientId?.toLowerCase().contains(query) ?? false) ||
            (patient.phone?.toLowerCase().contains(query) ?? false) ||
            (patient.email?.toLowerCase().contains(query) ?? false) ||
            (patient.gender?.toLowerCase().contains(query) ?? false);
      }).toList();
    }
  }

  void _onSearchChanged(String value) {
    setState(() {
      searchQuery = value;
      _filterPatients();
    });
  }

  Future<void> _deletePatient() async {
    if (patientToDelete == null) return;

    try {
      final api = ApiClient();
      await api.dio.delete('/api/patients/${patientToDelete!.id}/');

      setState(() {
        patients.removeWhere((p) => p.id == patientToDelete!.id);
        _filterPatients();
        patientToDelete = null;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Patient deleted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete patient: $e')),
        );
      }
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '—';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Patient Management',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Manage and monitor all registered patients',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () => context.go('/admin/register-patient'),
                    icon: const Icon(Icons.add),
                    label: const Text('Add New Patient'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Search Bar
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    TextField(
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        hintText:
                            'Search by name, ID, phone, email, or gender...',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.grey[50],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          '${filteredPatients.length} of ${patients.length} patients',
                          style: const TextStyle(
                            color: Color(0xFF757575),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Loading/Error States
              if (loading)
                const Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('Loading patients...'),
                      ],
                    ),
                  ),
                )
              else if (error != null)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.error,
                          size: 48,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.red),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadPatients,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              else if (filteredPatients.isEmpty)
                const Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.people,
                          size: 48,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No patients found',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF757575),
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Try adjusting your search criteria',
                          style: const TextStyle(color: Color(0xFF9E9E9E)),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              else
                // Patient List
                Expanded(
                  child: ListView.builder(
                    itemCount: filteredPatients.length,
                    itemBuilder: (context, index) {
                      final patient = filteredPatients[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: const Color(0xFF10B981)
                                        .withOpacity(0.1),
                                    child: Text(
                                      patient.fullName.isNotEmpty
                                          ? patient.fullName[0].toUpperCase()
                                          : 'U',
                                      style: const TextStyle(
                                        color: Color(0xFF10B981),
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          patient.fullName,
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black87,
                                          ),
                                        ),
                                        if (patient.patientId != null)
                                          Container(
                                            margin:
                                                const EdgeInsets.only(top: 4),
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.grey[100],
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              'ID: ${patient.patientId}',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: const Color(0xFF616161),
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      // View and Edit buttons removed - screens not implemented yet
                                      TextButton.icon(
                                        onPressed: () => setState(
                                            () => patientToDelete = patient),
                                        icon: const Icon(Icons.delete),
                                        label: const Text('Delete'),
                                        style: TextButton.styleFrom(
                                          foregroundColor: Colors.red,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // SingleChildScrollView(
                              //   child: Row(

                              //     children: [
                              //       // Expanded(
                              //         // child:
                              //          _buildInfoItem(
                              //           Icons.calendar_today,
                              //           'DOB',
                              //           _formatDate(patient.dob),
                              //         ),
                              //       // ),
                              //       // Expanded(
                              //         // child:
                              //          _buildInfoItem(
                              //           Icons.person,
                              //           'Gender',
                              //           patient.gender ?? '—',
                              //         ),
                              //       // ),
                              //       if (patient.phone != null ||
                              //           patient.email != null)
                              //         // Expanded(
                              //           // child:
                              //            _buildContactInfo(patient),
                              //         // ),
                              //     ],
                              //   ),
                              // ),
                              Wrap(
                                spacing: 12,
                                runSpacing: 8,
                                children: [
                                  _buildInfoItem(Icons.calendar_today, 'DOB',
                                      _formatDate(patient.dob)),
                                  _buildInfoItem(Icons.person, 'Gender',
                                      patient.gender ?? '—'),
                                  if (patient.phone != null ||
                                      patient.email != null)
                                    _buildContactInfo(patient),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

              // Delete Confirmation Dialog
              if (patientToDelete != null)
                Container(
                  color: Colors.black.withOpacity(0.5),
                  child: Center(
                    child: Container(
                      margin: const EdgeInsets.all(24),
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.warning,
                            size: 48,
                            color: Colors.red,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Delete Patient',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Are you sure you want to delete ${patientToDelete!.fullName}? This action cannot be undone.',
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(
                                child: TextButton(
                                  onPressed: () =>
                                      setState(() => patientToDelete = null),
                                  child: const Text('Cancel'),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _deletePatient,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Delete'),
                                ),
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
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String label, String value) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 320),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Text.rich(
          TextSpan(
            children: [
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: Icon(icon, size: 16, color: const Color(0xFF757575)),
              ),
              const WidgetSpan(child: SizedBox(width: 6)),
              TextSpan(
                text: '$label: ',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
              ),
              TextSpan(
                text: value,
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  Widget _buildContactInfo(Patient patient) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 360),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (patient.phone != null) ...[
              Row(
                children: [
                  Icon(Icons.phone, size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      patient.phone!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.black87,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            if (patient.email != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.email, size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      patient.email!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.black87,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
