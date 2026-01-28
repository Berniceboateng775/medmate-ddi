import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Production base URL (can be overridden with --dart-define=BASE_URL=...)
const String kBaseUrl = String.fromEnvironment(
  'BASE_URL',
  defaultValue: 'https://ddi-2n0x.onrender.com',
);

class ApiClient {
  final Dio dio;
  final FlutterSecureStorage storage;
  final String baseUrl;

  ApiClient({String? baseUrl})
      : baseUrl = baseUrl ?? kBaseUrl,
        dio = Dio(BaseOptions(baseUrl: baseUrl ?? kBaseUrl)),
        storage = const FlutterSecureStorage() {
    print('ApiClient initialized with baseUrl: ${baseUrl ?? kBaseUrl}');
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        print('ApiClient interceptor: Making request to ${options.uri}');
        final token = await storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
          print('ApiClient interceptor: Added auth header');
        } else {
          print('ApiClient interceptor: No access token found');
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        print(
            'ApiClient interceptor: Error occurred - ${e.response?.statusCode} ${e.message}');
        if (e.response?.statusCode == 401) {
          print('ApiClient interceptor: 401 error, attempting token refresh');
          final ok = await _refreshToken();
          if (ok) {
            final req = e.requestOptions;
            final token = await storage.read(key: 'access_token');
            req.headers['Authorization'] = 'Bearer $token';
            final resp = await dio.fetch(req);
            return handler.resolve(resp);
          } else {
            print('ApiClient interceptor: Token refresh failed');
          }
        }
        return handler.next(e);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    final refresh = await storage.read(key: 'refresh_token');
    if (refresh == null) return false;
    try {
      final r = await dio
          .post('/api/auth/token/refresh/', data: {'refresh': refresh});
      final access = r.data['access'] as String?;
      if (access == null) return false;
      await storage.write(key: 'access_token', value: access);
      return true;
    } catch (_) {
      await storage.delete(key: 'access_token');
      await storage.delete(key: 'refresh_token');
      return false;
    }
  }
}
