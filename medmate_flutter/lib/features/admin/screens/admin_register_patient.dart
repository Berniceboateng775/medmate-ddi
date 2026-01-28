import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';

class AdminRegisterPatient extends ConsumerStatefulWidget {
  const AdminRegisterPatient({super.key});

  @override
  ConsumerState<AdminRegisterPatient> createState() =>
      _AdminRegisterPatientState();
}

class _AdminRegisterPatientState extends ConsumerState<AdminRegisterPatient> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  String? _errorMessage;

  // Form fields
  final fullName = TextEditingController();
  final dob = TextEditingController();
  String gender = '';
  final phone = TextEditingController();
  final email = TextEditingController();
  final allergies = TextEditingController();
  final pastAdverseReactions = TextEditingController();
  final medicalConditions = TextEditingController();
  final geneticInfo = TextEditingController();
  final weightKg = TextEditingController();
  final heightCm = TextEditingController();
  String bloodType = '';
  final emergencyContact = TextEditingController();

  @override
  void dispose() {
    fullName.dispose();
    dob.dispose();
    phone.dispose();
    email.dispose();
    allergies.dispose();
    pastAdverseReactions.dispose();
    medicalConditions.dispose();
    geneticInfo.dispose();
    weightKg.dispose();
    heightCm.dispose();
    emergencyContact.dispose();
    super.dispose();
  }

  double? _parseDouble(String value) {
    if (value.trim().isEmpty) return null;
    return double.tryParse(value);
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final api = ApiClient();
      final payload = {
        'full_name': fullName.text.trim(),
        'dob': dob.text,
        'gender': gender,
        'phone': phone.text.trim(),
        'email': email.text.trim(),
        'allergies': allergies.text.trim(),
        'past_adverse_reactions': pastAdverseReactions.text.trim(),
        'medical_conditions': medicalConditions.text.trim(),
        'genetic_info': geneticInfo.text.trim(),
        'weight_kg': _parseDouble(weightKg.text),
        'height_cm': _parseDouble(heightCm.text),
        'blood_type': bloodType,
        'emergency_contact': emergencyContact.text.trim(),
      };

      await api.dio.post('/api/patients/', data: payload);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Patient registered successfully')),
        );
        context.go('/admin/patients');
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to register patient: $e';
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    IconButton(
                      onPressed: () => context.go('/admin/patients'),
                      icon: const Icon(Icons.arrow_back),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Register New Patient',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Add a new patient to the hospital system',
                            style: TextStyle(
                              color: const Color(0xFF757575),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Error Message
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red[200]!),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),

                const SizedBox(height: 24),

                // Personal Information Section
                _buildSection(
                  icon: Icons.person,
                  title: 'Personal Information',
                  children: [
                    _buildTextField(
                      controller: fullName,
                      label: 'Full Name',
                      required: true,
                      hint: 'e.g. Ama K. Mensah',
                    ),
                    const SizedBox(height: 16),
                    _buildDateField(
                      controller: dob,
                      label: 'Date of Birth',
                      required: true,
                    ),
                    const SizedBox(height: 16),
                    _buildDropdownField(
                      value: gender,
                      label: 'Gender',
                      required: true,
                      items: const [
                        DropdownMenuItem(value: 'Male', child: Text('Male')),
                        DropdownMenuItem(
                            value: 'Female', child: Text('Female')),
                        DropdownMenuItem(value: 'Other', child: Text('Other')),
                        DropdownMenuItem(
                            value: 'PreferNotToSay',
                            child: Text('Prefer not to say')),
                      ],
                      onChanged: (value) =>
                          setState(() => gender = value ?? ''),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Contact Information Section
                _buildSection(
                  icon: Icons.contact_mail,
                  title: 'Contact Information',
                  children: [
                    _buildTextField(
                      controller: phone,
                      label: 'Phone Number',
                      hint: '+233 24 123 4567',
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: email,
                      label: 'Email Address',
                      hint: 'patient@example.com',
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: emergencyContact,
                      label: 'Emergency Contact',
                      hint: 'Name & phone number',
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Medical Information Section
                _buildSection(
                  icon: Icons.medical_services,
                  title: 'Medical Information',
                  children: [
                    _buildTextField(
                      controller: allergies,
                      label: 'Allergies',
                      hint: 'e.g. Penicillin, nuts',
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: pastAdverseReactions,
                      label: 'Past Adverse Reactions',
                      hint: 'e.g. Rash after ibuprofen',
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: medicalConditions,
                      label: 'Medical Conditions',
                      hint: 'e.g. Hypertension, Type 2 Diabetes',
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: geneticInfo,
                      label: 'Genetic Information',
                      hint: 'e.g. CYP2D6 poor metabolizer',
                      maxLines: 2,
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Physical Measurements Section
                _buildSection(
                  icon: Icons.monitor_weight,
                  title: 'Physical Measurements',
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: weightKg,
                            label: 'Weight (kg)',
                            hint: 'e.g. 70.5',
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: heightCm,
                            label: 'Height (cm)',
                            hint: 'e.g. 168',
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildDropdownField(
                      value: bloodType,
                      label: 'Blood Type',
                      items: const [
                        DropdownMenuItem(
                            value: '', child: Text('Select Blood Type')),
                        DropdownMenuItem(value: 'A+', child: Text('A+')),
                        DropdownMenuItem(value: 'A-', child: Text('A-')),
                        DropdownMenuItem(value: 'B+', child: Text('B+')),
                        DropdownMenuItem(value: 'B-', child: Text('B-')),
                        DropdownMenuItem(value: 'AB+', child: Text('AB+')),
                        DropdownMenuItem(value: 'AB-', child: Text('AB-')),
                        DropdownMenuItem(value: 'O+', child: Text('O+')),
                        DropdownMenuItem(value: 'O-', child: Text('O-')),
                      ],
                      onChanged: (value) =>
                          setState(() => bloodType = value ?? ''),
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Submit Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => context.go('/admin/patients'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: BorderSide(color: Colors.grey[300]!),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submitForm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white),
                                ),
                              )
                            : const Text('Add Patient'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSection({
    required IconData icon,
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: const Color(0xFF10B981), size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    bool required = false,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: required ? '$label *' : label,
        hintText: hint,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: required
          ? (value) =>
              (value?.trim().isEmpty ?? true) ? 'This field is required' : null
          : null,
    );
  }

  Widget _buildDateField({
    required TextEditingController controller,
    required String label,
    bool required = false,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: required ? '$label *' : label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        filled: true,
        fillColor: Colors.grey[50],
        suffixIcon: const Icon(Icons.calendar_today),
      ),
      readOnly: true,
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: DateTime.now().subtract(const Duration(days: 365 * 20)),
          firstDate: DateTime(1900),
          lastDate: DateTime.now(),
        );
        if (date != null) {
          controller.text =
              '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
        }
      },
      validator: required
          ? (value) =>
              (value?.isEmpty ?? true) ? 'This field is required' : null
          : null,
    );
  }

  Widget _buildDropdownField({
    required String value,
    required String label,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
    bool required = false,
  }) {
    return DropdownButtonFormField<String>(
      value: value.isEmpty ? null : value,
      decoration: InputDecoration(
        labelText: required ? '$label *' : label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      items: items,
      onChanged: onChanged,
      validator: required
          ? (value) =>
              (value?.isEmpty ?? true) ? 'This field is required' : null
          : null,
    );
  }
}
