import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';

class DoctorPatients extends StatefulWidget {
  const DoctorPatients({super.key});
  @override
  State<DoctorPatients> createState() => _DoctorPatientsState();
}

class _DoctorPatientsState extends State<DoctorPatients> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;

  final _scrollCtrl = ScrollController();
  final _api = ApiClient();

  // Data
  final List<Map<String, dynamic>> _items = [];
  String? _nextUrl; // DRF pagination "next"
  bool _initialLoading = true;
  bool _loadingMore = false;
  String? _error;

  CancelToken? _ongoing;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
    _scrollCtrl.addListener(_maybeLoadMoreOnScroll);
    _searchCtrl.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _searchCtrl.dispose();
    _debounce?.cancel();
    _ongoing?.cancel();
    super.dispose();
  }

  void _onSearchChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _load(reset: true);
    });
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      _ongoing?.cancel();
      _ongoing = CancelToken();
      setState(() {
        _items.clear();
        _nextUrl = null;
        _error = null;
        _initialLoading = true;
      });
    }

    try {
      final q = _searchCtrl.text.trim();
      // Start with standard DRF list endpoint
      final r = await _api.dio.get(
        '/api/patients/',
        queryParameters: {
          if (q.isNotEmpty)
            'search': q, // common DRF filter; harmless if unused
        },
        cancelToken: _ongoing,
      );

      _consumeResponse(r.data, replace: true);
      setState(() => _error = null);
    } on DioException catch (e) {
      setState(() => _error = e.response?.data?.toString() ?? e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _initialLoading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_nextUrl == null || _loadingMore) return;
    setState(() => _loadingMore = true);
    try {
      // _nextUrl may be absolute or relative
      Response r;
      if (_nextUrl!.startsWith('http')) {
        r = await _api.dio.getUri(Uri.parse(_nextUrl!));
      } else {
        r = await _api.dio.get(_nextUrl!);
      }
      _consumeResponse(r.data, replace: false);
    } on DioException catch (e) {
      // keep existing items, show a toast-like message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  'Load more failed: ${e.response?.statusCode ?? ''} ${e.message}')),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  void _maybeLoadMoreOnScroll() {
    if (_nextUrl == null) return;
    if (_scrollCtrl.position.pixels >=
        _scrollCtrl.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  void _consumeResponse(dynamic data, {required bool replace}) {
    // Accept both:
    // 1) List<dynamic>
    // 2) { results: [...], next: 'url', count: N }
    List items;
    String? nextUrl;

    if (data is List) {
      items = data;
      nextUrl = null;
    } else if (data is Map && data['results'] is List) {
      items = data['results'] as List;
      final n = data['next'];
      nextUrl = n == null ? null : n.toString();
    } else {
      // Unknown shape, try best-effort
      items = const [];
      nextUrl = null;
    }

    final mapped = items.map<Map<String, dynamic>>((e) {
      if (e is Map) return Map<String, dynamic>.from(e);
      return <String, dynamic>{};
    }).toList();

    setState(() {
      if (replace) {
        _items
          ..clear()
          ..addAll(mapped);
      } else {
        _items.addAll(mapped);
      }
      _nextUrl = nextUrl;
    });
  }

  Future<void> _onRefresh() async => _load(reset: true);

  String _fmtDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '—';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredCount =
        _items.length; // In real app, this would be filtered count
    final totalCount = _items.length; // In real app, this would be total count

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Your Patients',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Manage and view your patient records',
                            style: TextStyle(
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Search and stats
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: TextField(
                          controller: _searchCtrl,
                          decoration: InputDecoration(
                            hintText: 'Search patients...',
                            prefixIcon:
                                Icon(Icons.search, color: Colors.grey[400]),
                            suffixIcon: _searchCtrl.text.isNotEmpty
                                ? IconButton(
                                    icon: Icon(Icons.clear,
                                        color: Colors.grey[400]),
                                    onPressed: () {
                                      _searchCtrl.clear();
                                      _load(reset: true);
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    IconButton(
                      onPressed: () => _load(reset: true),
                      icon: const Icon(Icons.refresh),
                      tooltip: 'Refresh',
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Results counter
                Row(
                  children: [
                    Text(
                      'Showing $filteredCount of $totalCount patients',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    if (_searchCtrl.text.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () {
                          _searchCtrl.clear();
                          _load(reset: true);
                        },
                        child: const Text(
                          'Clear search',
                          style: TextStyle(
                            color: Colors.green,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: RefreshIndicator(
              onRefresh: _onRefresh,
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_initialLoading) {
      return ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: 6,
        itemBuilder: (_, __) => const _SkeletonCard(),
      );
    }

    if (_error != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Icon(Icons.error, size: 64, color: Colors.red[400]),
                const SizedBox(height: 16),
                const Text(
                  'Error Loading Patients',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: TextStyle(color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => _load(reset: true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Retry Loading'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    if (_items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Icon(Icons.people, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                const Text(
                  'No patients found',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _searchCtrl.text.isNotEmpty
                      ? 'Try adjusting your search terms.'
                      : 'Patients will appear here once they are registered.',
                  style: TextStyle(color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      );
    }

    return GridView.builder(
      controller: _scrollCtrl,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 1,
        childAspectRatio: 3.5,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _items.length + (_nextUrl != null ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _items.length) {
          // Load more footer
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Center(
              child: _loadingMore
                  ? const CircularProgressIndicator()
                  : OutlinedButton(
                      onPressed: _loadMore,
                      child: const Text('Load more'),
                    ),
            ),
          );
        }

        final patient = _items[index];
        final id = (patient['id'] ?? '').toString();
        final fullName =
            (patient['full_name'] ?? patient['name'] ?? 'Unnamed Patient')
                .toString();
        final patientId = (patient['patient_id'] ?? '').toString();
        final dob = _fmtDate(patient['dob']);
        final gender = (patient['gender'] ?? '—').toString();
        final phone = patient['phone'];
        final email = patient['email'];

        return Card(
          elevation: 1,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: InkWell(
            onTap: id.isEmpty
                ? null
                : () {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      context.go('/doctor/patient/$id');
                    });
                  },
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Avatar
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.green[100],
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Icon(
                      Icons.person,
                      color: Colors.green[600],
                      size: 24,
                    ),
                  ),

                  const SizedBox(width: 16),

                  // Patient info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                fullName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (patientId.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'ID: $patientId',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.grey[700],
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ],
                        ),

                        const SizedBox(height: 8),

                        // DOB and Gender
                        Row(
                          children: [
                            Icon(Icons.calendar_today,
                                size: 14, color: Colors.grey[500]),
                            const SizedBox(width: 4),
                            Text(
                              'DOB: $dob',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(width: 16),
                            Icon(Icons.person_outline,
                                size: 14, color: Colors.grey[500]),
                            const SizedBox(width: 4),
                            Text(
                              'Gender: $gender',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),

                        // Contact info
                        if (phone != null || email != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              if (phone != null) ...[
                                Icon(Icons.phone,
                                    size: 14, color: Colors.grey[500]),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    phone.toString(),
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.grey[600],
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                              if (phone != null && email != null)
                                const SizedBox(width: 16),
                              if (email != null) ...[
                                Icon(Icons.email,
                                    size: 14, color: Colors.grey[500]),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    email.toString(),
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.grey[600],
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Arrow
                  Icon(
                    Icons.chevron_right,
                    color: Colors.grey[400],
                    size: 24,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(24),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 16,
                    width: double.infinity,
                    color: Colors.grey[200],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 12,
                    width: 120,
                    color: Colors.grey[200],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 12,
                    width: 80,
                    color: Colors.grey[200],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
