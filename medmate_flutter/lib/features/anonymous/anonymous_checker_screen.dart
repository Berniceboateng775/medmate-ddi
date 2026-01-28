import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';

class AnonymousCheckerScreen extends StatefulWidget {
  const AnonymousCheckerScreen({super.key});
  @override
  State<AnonymousCheckerScreen> createState() => _AnonymousCheckerScreenState();
}

class _AnonymousCheckerScreenState extends State<AnonymousCheckerScreen> {
  final List<TextEditingController> drugControllers = [
    TextEditingController(),
    TextEditingController()
  ];
  List<String> drugPairs = [];
  String selectedPair = '';
  Map<String, dynamic>? interactionResult;
  bool loadingInteraction = false;
  bool generatingPairs = false;

  @override
  void dispose() {
    for (final controller in drugControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _addDrugField() {
    setState(() {
      drugControllers.add(TextEditingController());
    });
  }

  void _removeDrugField(int index) {
    if (drugControllers.length > 2) {
      setState(() {
        drugControllers.removeAt(index);
        drugPairs.clear();
        selectedPair = '';
        interactionResult = null;
      });
    } else {
      _showMessage('At least two drug fields are required.', Colors.red);
    }
  }

  void _generatePairs() {
    final validDrugs = drugControllers
        .map((c) => c.text.trim())
        .where((text) => text.isNotEmpty)
        .toSet()
        .toList();

    if (validDrugs.length < 2) {
      _showMessage('Please enter at least two valid drugs.', Colors.red);
      return;
    }

    setState(() {
      generatingPairs = true;
    });

    final pairs = <String>[];
    for (int i = 0; i < validDrugs.length; i++) {
      for (int j = i + 1; j < validDrugs.length; j++) {
        pairs.add('${validDrugs[i]}, ${validDrugs[j]}');
      }
    }

    setState(() {
      drugPairs = pairs;
      selectedPair = '';
      interactionResult = null;
      generatingPairs = false;
    });

    _showMessage('Drug pairs generated successfully!', Colors.green);
  }

  Future<void> _checkInteraction() async {
    if (selectedPair.isEmpty) {
      _showMessage('Please select a drug pair to check.', Colors.red);
      return;
    }

    setState(() {
      loadingInteraction = true;
      interactionResult = null;
    });

    try {
      final api = ApiClient();
      final response = await api.dio.post('/api/ddi/check/', data: {
        'selected_pair': selectedPair,
      });

      setState(() {
        interactionResult = {
          'drugs': selectedPair,
          'severity': response.data?['severity'] ?? 'Unknown',
          'description':
              response.data?['description'] ?? 'No description provided.',
          'extended_explanation': response.data?['extended_explanation'] ?? '',
          'recommendation':
              response.data?['recommendation'] ?? 'No recommendation provided.',
        };
      });

      _showMessage('Interaction checked successfully!', Colors.green);
    } on DioException catch (e) {
      setState(() {
        interactionResult = {
          'error': 'Failed to check DDI: ${e.response?.data ?? e.message}',
        };
      });
      _showMessage('Failed to check interaction.', Colors.red);
    } catch (e) {
      setState(() {
        interactionResult = {
          'error': 'An unexpected error occurred.',
        };
      });
      _showMessage('An unexpected error occurred.', Colors.red);
    } finally {
      setState(() {
        loadingInteraction = false;
      });
    }
  }

  void _showMessage(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 3),
      ),
    );
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
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
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
                          onPressed: () => context.go('/'),
                          child: const Text(
                            'Home',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Centered "AI-Powered Analysis" pill
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
                                color: Colors.white, // text-white
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Centered title
                    const Center(
                      child: Text(
                        'Drug Interaction\nChecker',
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
                    Text(
                      'Advanced pharmaceutical analysis powered by clinical databases and AI algorithms.',
                      style: TextStyle(
                        color: Colors.grey[300],
                        fontSize: 16,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),

              // Main Content
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Drug Input Section
                    Container(
                      padding: const EdgeInsets.all(20),
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
                                'DRUG INTERACTION ANALYSIS',
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

                          // Drug Input Fields
                          ...drugControllers.asMap().entries.map((entry) {
                            final index = entry.key;
                            final controller = entry.value;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: controller,
                                      decoration: InputDecoration(
                                        hintText:
                                            'Enter drug ${index + 1} name',
                                        hintStyle:
                                            TextStyle(color: Colors.grey[400]),
                                        filled: true,
                                        fillColor: Colors.grey[50],
                                        border: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          borderSide: BorderSide.none,
                                        ),
                                        contentPadding:
                                            const EdgeInsets.symmetric(
                                          horizontal: 16,
                                          vertical: 14,
                                        ),
                                      ),
                                      onChanged: (_) {
                                        setState(() {
                                          drugPairs.clear();
                                          selectedPair = '';
                                          interactionResult = null;
                                        });
                                      },
                                    ),
                                  ),
                                  if (drugControllers.length > 2) ...[
                                    const SizedBox(width: 8),
                                    IconButton(
                                      onPressed: () => _removeDrugField(index),
                                      icon: const Icon(
                                        Icons.remove_circle,
                                        color: Colors.red,
                                      ),
                                      tooltip: 'Remove drug',
                                    ),
                                  ],
                                ],
                              ),
                            );
                          }).toList(),

                          const SizedBox(height: 16),

                          // Action Buttons
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _addDrugField,
                                  icon: const Icon(Icons.add),
                                  label: const Text('Add Drug'),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                    side: BorderSide(color: Colors.grey[300]!),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed:
                                      generatingPairs ? null : _generatePairs,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10B981),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: generatingPairs
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor:
                                                AlwaysStoppedAnimation<Color>(
                                                    Colors.white),
                                          ),
                                        )
                                      : const Text('Generate Pairs'),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 20),

                          // Drug Pair Selection
                          if (drugPairs.isNotEmpty) ...[
                            const Text(
                              'Select Drug Pair for Analysis',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              decoration: BoxDecoration(
                                color: Colors.grey[50],
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey[200]!),
                              ),
                              child: DropdownButton<String>(
                                value:
                                    selectedPair.isEmpty ? null : selectedPair,
                                hint: const Text('Choose pair for analysis'),
                                isExpanded: true,
                                underline: const SizedBox(),
                                items: drugPairs.map((pair) {
                                  return DropdownMenuItem<String>(
                                    value: pair,
                                    child: Text(pair),
                                  );
                                }).toList(),
                                onChanged: (value) {
                                  setState(() {
                                    selectedPair = value ?? '';
                                    interactionResult = null;
                                  });
                                },
                              ),
                            ),
                          ],

                          const SizedBox(height: 20),

                          // Check Interaction Button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed:
                                  loadingInteraction ? null : _checkInteraction,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981),
                                foregroundColor: Colors.white,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 2,
                              ),
                              child: loadingInteraction
                                  ? const Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor:
                                                AlwaysStoppedAnimation<Color>(
                                                    Colors.white),
                                          ),
                                        ),
                                        SizedBox(width: 12),
                                        Text('Analyzing...'),
                                      ],
                                    )
                                  : const Text(
                                      'Analyze Drug Interactions',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Pro Tip
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFD1FAE5),
                              borderRadius: BorderRadius.circular(8),
                              border:
                                  Border.all(color: const Color(0xFFA7F3D0)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.lightbulb,
                                    color: Color(0xFF059669), size: 20),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Text(
                                    'Supports 2-5 drugs • Real-time analysis • Clinical-grade accuracy',
                                    style: TextStyle(
                                      color: Color(0xFF065F46),
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Results Section
                    if (interactionResult != null) ...[
                      Container(
                        padding: const EdgeInsets.all(20),
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
                                  'ANALYSIS RESULTS',
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
                            if (interactionResult!['error'] != null) ...[
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.red[50],
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.red[200]!),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.error, color: Colors.red[600]),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        interactionResult!['error'],
                                        style:
                                            TextStyle(color: Colors.red[800]),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ] else ...[
                              // Drug Pair and Severity
                              Row(
                                children: [
                                  const Text(
                                    'Drug Pair:',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w500,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      interactionResult!['drugs'],
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  _buildSeverityBadge(
                                    interactionResult!['severity'],
                                  ),
                                ],
                              ),

                              const SizedBox(height: 20),

                              // Description
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFD1FAE5),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: const Color(0xFFA7F3D0),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Interaction Description',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF065F46),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      interactionResult!['description'],
                                      style: const TextStyle(
                                        color: Colors.black87,
                                        height: 1.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Extended Description
                              if (interactionResult!['extended_explanation']
                                      is String &&
                                  (interactionResult!['extended_explanation']
                                          as String)
                                      .isNotEmpty) ...[
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[50],
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: Colors.grey[200]!,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Extended Explanation',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        interactionResult![
                                            'extended_explanation'],
                                        style: const TextStyle(
                                          color: Colors.black87,
                                          height: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],

                              // Recommendations
                              if (interactionResult!['recommendation'] !=
                                  null) ...[
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: Colors.grey[200]!,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Recommendations',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        interactionResult!['recommendation'],
                                        style: const TextStyle(
                                          color: Colors.black87,
                                          height: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ],
                        ),
                      ),
                    ],

                    // Empty State (only when no results AND not loading)
                    if (interactionResult == null && !loadingInteraction) ...[
                      Container(
                        padding: const EdgeInsets.all(40),
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
                            Icon(
                              Icons.science,
                              size: 48,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No analysis results yet',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Add drugs, generate pairs, and run analysis to see results.',
                              style: TextStyle(
                                color: Colors.grey[500],
                                height: 1.4,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),

                    // Provider Access Section
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [const Color(0xFFD1FAE5), Colors.white],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.medical_services,
                                  color: Color(0xFF059669)),
                              const SizedBox(width: 12),
                              const Text(
                                'Healthcare Provider Access',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'For healthcare providers: Login to access patient drug profiles, detailed clinical reports, and advanced analysis tools.',
                            style: TextStyle(
                              color: Colors.grey[600],
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () => context.go('/login'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.grey[900],
                                foregroundColor: Colors.white,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: const Text('Provider Login'),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Medical Disclaimer
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red[200]!),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.warning, color: Colors.red[600], size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Medical Disclaimer',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.red[800],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'This tool provides educational information only. Always consult healthcare professionals before making medication decisions.',
                                  style: TextStyle(
                                    color: Colors.red[700],
                                    fontSize: 12,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
