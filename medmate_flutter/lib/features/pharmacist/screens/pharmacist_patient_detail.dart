import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

class PharmacistPatientDetail extends StatefulWidget {
  final String id;
  const PharmacistPatientDetail({super.key, required this.id});

  @override
  State<PharmacistPatientDetail> createState() =>
      _PharmacistPatientDetailState();
}

class _PharmacistPatientDetailState extends State<PharmacistPatientDetail> {
  bool loading = true;
  String? error;
  Map<String, dynamic>? patient;
  List<dynamic> meds = [];

  // Prescribe form
  final drugNameCtrl = TextEditingController();
  final dosageCtrl = TextEditingController();
  final frequencyCtrl = TextEditingController();
  final startDateCtrl = TextEditingController();
  final endDateCtrl = TextEditingController();

  // Edit form
  int? editingMedId;
  final editDrugNameCtrl = TextEditingController();
  final editDosageCtrl = TextEditingController();
  final editFrequencyCtrl = TextEditingController();
  final editStartDateCtrl = TextEditingController();
  final editEndDateCtrl = TextEditingController();

  // DDI
  List<String> pairOptions = [];
  String selectedPair = '';
  Map<String, dynamic>? ddiResult;
  bool loadingInteraction = false;

  @override
  void initState() {
    super.initState();
    _loadPatient();
  }

  @override
  void dispose() {
    drugNameCtrl.dispose();
    dosageCtrl.dispose();
    frequencyCtrl.dispose();
    startDateCtrl.dispose();
    endDateCtrl.dispose();
    editDrugNameCtrl.dispose();
    editDosageCtrl.dispose();
    editFrequencyCtrl.dispose();
    editStartDateCtrl.dispose();
    editEndDateCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadPatient() async {
    setState(() {
      loading = true;
      error = null;
    });
    final api = ApiClient();

    try {
      // Patient detail
      final pRes = await api.dio.get('/api/patients/${widget.id}/');
      final p = Map<String, dynamic>.from(pRes.data);

      // Medications for this patient
      final mRes = await api.dio
          .get('/api/medications/', queryParameters: {'patient': widget.id});
      dynamic medData = mRes.data;
      List medList;
      if (medData is List) {
        medList = medData;
      } else if (medData is Map && medData['results'] is List) {
        medList = medData['results'] as List;
      } else {
        medList = [];
      }
      final m = medList.cast<dynamic>();

      // Initialize DDI fields with current medication names if available
      final initialNames = _extractDrugNames(m);
      pairOptions.clear();
      if (initialNames.isNotEmpty) {
        pairOptions.addAll(_buildPairs(initialNames));
      }

      setState(() {
        patient = p;
        meds = m;
      });
    } on DioException catch (e) {
      setState(() => error = e.response?.data?.toString() ?? e.message);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  List<String> _extractDrugNames(List<dynamic> meds) {
    final names = <String>[];
    for (final item in meds) {
      if (item is Map<String, dynamic>) {
        dynamic possible;
        if (item['drug'] is Map) {
          possible =
              (item['drug'] as Map)['name'] ?? (item['drug'] as Map)['title'];
        }
        possible ??= item['drug_name'] ?? item['name'] ?? item['title'];
        if (possible != null) {
          final s = possible.toString().trim();
          if (s.isNotEmpty) names.add(s);
        }
      }
    }
    return names.toSet().toList(); // unique
  }

  List<String> _buildPairs(List<String> names) {
    final pairs = <String>[];
    for (int i = 0; i < names.length; i++) {
      for (int j = i + 1; j < names.length; j++) {
        pairs.add('${names[i]}, ${names[j]}');
      }
    }
    return pairs;
  }

  Future<void> _prescribe() async {
    if (drugNameCtrl.text.trim().isEmpty ||
        dosageCtrl.text.trim().isEmpty ||
        frequencyCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Please fill drug name, dosage and frequency.')));
      return;
    }

    final api = ApiClient();
    try {
      await api.dio.post('/api/medications/', data: {
        'patient': widget.id,
        'drug_name': drugNameCtrl.text.trim(),
        'dosage': dosageCtrl.text.trim(),
        'frequency': frequencyCtrl.text.trim(),
        'start_date': startDateCtrl.text.isNotEmpty ? startDateCtrl.text : null,
        'end_date': endDateCtrl.text.isNotEmpty ? endDateCtrl.text : null,
      });

      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Medication added')));
      _clearPrescribeForm();
      _loadPatient();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add medication: $e')));
    }
  }

  void _clearPrescribeForm() {
    drugNameCtrl.clear();
    dosageCtrl.clear();
    frequencyCtrl.clear();
    startDateCtrl.clear();
    endDateCtrl.clear();
  }

  void _startEdit(Map<String, dynamic> med) {
    setState(() {
      editingMedId = med['id'];
      editDrugNameCtrl.text = med['drug_name'] ?? '';
      editDosageCtrl.text = med['dosage'] ?? '';
      editFrequencyCtrl.text = med['frequency'] ?? '';
      editStartDateCtrl.text = med['start_date'] ?? '';
      editEndDateCtrl.text = med['end_date'] ?? '';
    });
  }

  Future<void> _saveEdit() async {
    if (editDrugNameCtrl.text.trim().isEmpty ||
        editDosageCtrl.text.trim().isEmpty ||
        editFrequencyCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Please fill drug name, dosage and frequency.')));
      return;
    }

    final api = ApiClient();
    try {
      await api.dio.put('/api/medications/$editingMedId/', data: {
        'drug_name': editDrugNameCtrl.text.trim(),
        'dosage': editDosageCtrl.text.trim(),
        'frequency': editFrequencyCtrl.text.trim(),
        'start_date':
            editStartDateCtrl.text.isNotEmpty ? editStartDateCtrl.text : null,
        'end_date':
            editEndDateCtrl.text.isNotEmpty ? editEndDateCtrl.text : null,
        'patient': widget.id,
      });

      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Medication updated')));
      setState(() => editingMedId = null);
      _loadPatient();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update medication: $e')));
    }
  }

  Future<void> _deleteMed(int medId) async {
    final api = ApiClient();
    try {
      await api.dio.delete('/api/medications/$medId/');
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Medication deleted')));
      _loadPatient();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete medication: $e')));
    }
  }

  Future<void> _checkDDI() async {
    setState(() {
      loadingInteraction = true;
      ddiResult = null;
    });
    final api = ApiClient();
    try {
      final drugs =
          [drugNameCtrl.text.trim()].where((s) => s.isNotEmpty).toList();
      if (drugs.isEmpty && selectedPair.isNotEmpty) {
        // Use selected pair
        final r = await api.dio
            .post('/api/ddi/check/', data: {'selected_pair': selectedPair});
        setState(() => ddiResult = {
              'drugs': selectedPair,
              'severity': r.data?['severity'] ?? 'Unknown',
              'description':
                  r.data?['description'] ?? 'No description provided.',
              'recommendation':
                  r.data?['recommendation'] ?? 'No recommendation provided.',
              'extended_explanation': r.data?['extended_explanation'] ?? '',
            });
      } else {
        // Use manual input
        final r = await api.dio.post('/api/ddi/check/', data: {'drugs': drugs});
        setState(() => ddiResult = {
              'drugs': drugs.join(', '),
              'severity': r.data?['severity'] ?? 'Unknown',
              'description':
                  r.data?['description'] ?? 'No description provided.',
              'recommendation':
                  r.data?['recommendation'] ?? 'No recommendation provided.',
              'extended_explanation': r.data?['extended_explanation'] ?? '',
            });
      }
    } on DioException catch (e) {
      setState(() =>
          ddiResult = {'error': 'Error: ${e.response?.data ?? e.message}'});
    } finally {
      setState(() => loadingInteraction = false);
    }
  }

  Widget _buildSeverityBadge(String severity) {
    final severityLower = severity.toLowerCase();
    Color backgroundColor;
    Color textColor;

    if (severityLower.contains('contra') || severityLower.contains('major')) {
      backgroundColor = Colors.red[100]!;
      textColor = Colors.red[800]!;
    } else if (severityLower.contains('moderate')) {
      backgroundColor = Colors.orange[100]!;
      textColor = Colors.orange[800]!;
    } else {
      backgroundColor = Colors.grey[100]!;
      textColor = Colors.grey[800]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: backgroundColor.withOpacity(0.5)),
      ),
      child: Text(
        severity.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Patient Detail')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Patient Detail')),
        body: Center(child: Text('Error: $error')),
      );
    }
    if (patient == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Patient Detail')),
        body: const Center(child: Text('Patient not found')),
      );
    }

    final p = patient ?? {};
    final fullName = (p['full_name'] ?? p['name'] ?? 'Patient').toString();
    final dob = (p['dob'] ?? '-').toString();
    final gender = (p['gender'] ?? '-').toString();
    final id = (p['id'] ?? widget.id).toString();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('$fullName • ID $id'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Patient Info Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 20,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'PATIENT INFORMATION',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.person,
                          color: Color(0xFF10B981), size: 20),
                      const SizedBox(width: 8),
                      Text(
                        fullName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoItem('Gender', gender),
                      ),
                      Expanded(
                        child: _buildInfoItem('Date of Birth', dob),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Medications Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 20,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'CURRENT MEDICATIONS',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${meds.length}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (meds.isEmpty) ...[
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          children: [
                            Icon(
                              Icons.medication,
                              size: 48,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No medications recorded',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Start by prescribing a medication below.',
                              style: TextStyle(
                                color: Colors.grey[500],
                                fontSize: 14,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    ...meds.map((med) {
                      if (editingMedId == med['id']) {
                        return _buildEditForm();
                      }
                      return _buildMedicationCard(med);
                    }),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // DDI Checker Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 20,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'DRUG INTERACTION CHECKER',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (pairOptions.isNotEmpty) ...[
                    const Text(
                      'Select Drug Pair',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: DropdownButton<String>(
                        value: selectedPair.isEmpty ? null : selectedPair,
                        hint: const Text(
                            'Choose a drug pair to check for interactions'),
                        isExpanded: true,
                        underline: const SizedBox(),
                        items: pairOptions.map((pair) {
                          return DropdownMenuItem<String>(
                            value: pair,
                            child: Text(pair),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() => selectedPair = value ?? '');
                        },
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: loadingInteraction ? null : _checkDDI,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: loadingInteraction
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white),
                                  ),
                                ),
                                SizedBox(width: 8),
                                Text('Analyzing...'),
                              ],
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle, size: 16),
                                SizedBox(width: 8),
                                Text('Run DDI Check'),
                              ],
                            ),
                    ),
                  ),
                  if (ddiResult != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: ddiResult!['error'] != null
                          ? Row(
                              children: [
                                Icon(Icons.error, color: Colors.red[600]),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    ddiResult!['error'],
                                    style: TextStyle(color: Colors.red[800]),
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Text(
                                      'Result:',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: Colors.grey,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        ddiResult!['drugs'] ?? selectedPair,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black,
                                        ),
                                      ),
                                    ),
                                    if (ddiResult!['severity'] != null) ...[
                                      const SizedBox(width: 8),
                                      _buildSeverityBadge(
                                          ddiResult!['severity']),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  ddiResult!['description'] ??
                                      'No description available.',
                                  style: const TextStyle(
                                    color: Colors.black87,
                                    height: 1.4,
                                  ),
                                ),
                                if (ddiResult!['recommendation'] != null) ...[
                                  const SizedBox(height: 12),
                                  const Text(
                                    'Recommendation:',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    ddiResult!['recommendation'],
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                                if (ddiResult!['extended_explanation'] !=
                                        null &&
                                    ddiResult!['extended_explanation']
                                        .isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  const Text(
                                    'Extended Explanation:',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    ddiResult!['extended_explanation'],
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Prescribe Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 20,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'PRESCRIBE NEW MEDICATION',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: drugNameCtrl,
                    decoration: InputDecoration(
                      labelText: 'Drug Name',
                      hintText: 'Type drug name (e.g., Amoxicillin)',
                      filled: true,
                      fillColor: Colors.grey[50],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: dosageCtrl,
                          decoration: InputDecoration(
                            labelText: 'Dosage',
                            hintText: 'e.g., 500 mg',
                            filled: true,
                            fillColor: Colors.grey[50],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: frequencyCtrl,
                          decoration: InputDecoration(
                            labelText: 'Frequency',
                            hintText: 'e.g., twice daily',
                            filled: true,
                            fillColor: Colors.grey[50],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: startDateCtrl,
                          decoration: InputDecoration(
                            labelText: 'Start Date',
                            filled: true,
                            fillColor: Colors.grey[50],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                          keyboardType: TextInputType.datetime,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: endDateCtrl,
                          decoration: InputDecoration(
                            labelText: 'End Date',
                            filled: true,
                            fillColor: Colors.grey[50],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                          keyboardType: TextInputType.datetime,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _prescribe,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add, size: 16),
                          SizedBox(width: 8),
                          Text('Add Medication to Patient'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildMedicationCard(Map<String, dynamic> med) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.medication, color: const Color(0xFF10B981), size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  med['drug_name'] ?? 'Unknown',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit, color: Color(0xFF10B981)),
                    onPressed: () => _startEdit(med),
                    tooltip: 'Edit medication',
                    iconSize: 20,
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () => _deleteMed(med['id']),
                    tooltip: 'Delete medication',
                    iconSize: 20,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildMedDetail('Dosage', med['dosage'] ?? '—'),
              ),
              Expanded(
                child: _buildMedDetail('Frequency', med['frequency'] ?? '—'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildMedDetail('Start Date', med['start_date'] ?? '—'),
              ),
              Expanded(
                child: _buildMedDetail('End Date', med['end_date'] ?? '—'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMedDetail(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            color: Colors.black87,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildEditForm() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: editDrugNameCtrl,
                  decoration: InputDecoration(
                    labelText: 'Drug Name',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: editDosageCtrl,
                  decoration: InputDecoration(
                    labelText: 'Dosage',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: editFrequencyCtrl,
                  decoration: InputDecoration(
                    labelText: 'Frequency',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: editStartDateCtrl,
                  decoration: InputDecoration(
                    labelText: 'Start Date',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                  ),
                  keyboardType: TextInputType.datetime,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: editEndDateCtrl,
                  decoration: InputDecoration(
                    labelText: 'End Date',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                  ),
                  keyboardType: TextInputType.datetime,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _saveEdit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: const Text('Save Changes'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => editingMedId = null),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey[400]!),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
