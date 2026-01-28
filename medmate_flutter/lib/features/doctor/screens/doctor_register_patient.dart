import 'package:flutter/material.dart';

class DoctorRegisterPatient extends StatelessWidget {
  const DoctorRegisterPatient({super.key});
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 900),
          child: Column(
            children: const [
              Text('Register New Patient',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              SizedBox(height: 16),
              // TODO: Wire form fields after confirming backend schema
            ],
          ),
        ),
      ),
    );
  }
}
