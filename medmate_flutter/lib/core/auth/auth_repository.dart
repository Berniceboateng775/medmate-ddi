import 'package:dio/dio.dart';
import '../network/api_client.dart';

class AuthRepository {
  final ApiClient api;
  AuthRepository(this.api);

  Future<Map<String, dynamic>> login(String email, String password,
      {String? totpCode}) async {
    print('AuthRepository.login: Making request to /api/auth/login/');
    try {
      final data = {
        'email': email,
        'password': password,
      };
      if (totpCode != null) {
        data['totp_code'] = totpCode;
      }
      final r = await api.dio.post('/api/auth/login/', data: data);
      print('AuthRepository.login: Response status: ${r.statusCode}');
      print('AuthRepository.login: Response data: ${r.data}');
      return Map<String, dynamic>.from(r.data);
    } catch (e) {
      print('AuthRepository.login: Request failed with error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> profile() async {
    final r = await api.dio.get('/api/profile/');
    return Map<String, dynamic>.from(r.data);
  }
}
