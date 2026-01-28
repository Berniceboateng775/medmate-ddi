import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

class DoctorProfile extends StatefulWidget {
  const DoctorProfile({super.key});

  @override
  State<DoctorProfile> createState() => _DoctorProfileState();
}

class _DoctorProfileState extends State<DoctorProfile> {
  Map<String, dynamic>? profile;
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      loading = true;
      error = null;
    });
    final api = ApiClient();
    try {
      final res = await api.dio.get('/api/profile/');
      setState(() => profile = Map<String, dynamic>.from(res.data));
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (error != null)
      return Scaffold(
          appBar: AppBar(title: const Text('Profile')),
          body: Center(child: Text('Error: $error')));

    return Scaffold(
      appBar: AppBar(title: const Text('Your Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Name: ${profile?['name'] ?? 'Unknown'}'),
                Text('Email: ${profile?['email'] ?? 'Unknown'}'),
                Text('Role: ${profile?['role'] ?? 'Unknown'}'),
                if (profile?['specialization'] != null)
                  Text('Specialization: ${profile?['specialization']}'),
                if (profile?['license_number'] != null)
                  Text('License Number: ${profile?['license_number']}'),
                if (profile?['hospital'] != null)
                  Text('Hospital: ${profile?['hospital']}'),
                if (profile?['department'] != null)
                  Text('Department: ${profile?['department']}'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
