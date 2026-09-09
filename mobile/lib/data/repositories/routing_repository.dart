import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/campus_route.dart';
import '../models/destination.dart';

class RoutingResult {
  final CampusRoute? route;
  final String? errorMessage;
  final int statusCode;
  final int latencyMs;

  const RoutingResult({
    this.route,
    this.errorMessage,
    required this.statusCode,
    required this.latencyMs,
  });

  bool get isSuccess => route != null && errorMessage == null;
}

class RoutingRepository {
  final http.Client _client;

  RoutingRepository({http.Client? client}) : _client = client ?? http.Client();

  Future<RoutingResult> getRoute({
    required String campusId,
    required Destination origin,
    required Destination destination,
    bool accessible = false,
  }) async {
    final queryParams = {
      'fromLng': origin.longitude.toString(),
      'fromLat': origin.latitude.toString(),
      'toRoomId': destination.roomId,
      if (accessible) 'accessible': 'true',
    };

    final uri = Uri.parse(
      '${ApiConstants.baseUrl}${ApiConstants.routeEndpoint(campusId)}',
    ).replace(queryParameters: queryParams);

    final stopwatch = Stopwatch()..start();

    try {
      final response = await _client.get(
        uri,
        headers: {
          'Accept': 'application/json',
          'x-request-id': 'flutter-${DateTime.now().millisecondsSinceEpoch}',
        },
      ).timeout(ApiConstants.requestTimeout);

      stopwatch.stop();
      final latency = stopwatch.elapsedMilliseconds;

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body) as Map<String, dynamic>;
        final route = CampusRoute.fromGeoJson(decoded);
        return RoutingResult(
          route: route,
          statusCode: 200,
          latencyMs: latency,
        );
      }

      String message = 'Failed to calculate route (${response.statusCode})';
      try {
        final decoded = json.decode(response.body) as Map<String, dynamic>;
        if (decoded.containsKey('error') && decoded['error'] is String) {
          message = decoded['error'] as String;
        }
      } catch (_) {}

      return RoutingResult(
        errorMessage: message,
        statusCode: response.statusCode,
        latencyMs: latency,
      );
    } catch (e) {
      stopwatch.stop();
      return RoutingResult(
        errorMessage: e.toString(),
        statusCode: 0,
        latencyMs: stopwatch.elapsedMilliseconds,
      );
    }
  }

  void dispose() {
    _client.close();
  }
}
