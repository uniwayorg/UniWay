import 'package:maplibre_gl/maplibre_gl.dart';

class CampusRoute {
  final double distanceMeters;
  final List<LatLng> points;
  final List<List<double>> rawCoordinates;
  final Map<String, dynamic> rawFeature;

  const CampusRoute({
    required this.distanceMeters,
    required this.points,
    required this.rawCoordinates,
    required this.rawFeature,
  });

  double get estimatedMinutes => distanceMeters / (1.35 * 60);

  String get formattedDuration {
    final mins = estimatedMinutes;
    if (mins < 1.0) {
      final secs = (distanceMeters / 1.35).round();
      return '$secs sec';
    }
    return '${mins.toStringAsFixed(1)} min';
  }

  String get formattedDistance {
    if (distanceMeters >= 1000) {
      return '${(distanceMeters / 1000).toStringAsFixed(2)} km';
    }
    return '${distanceMeters.toStringAsFixed(1)} m';
  }

  factory CampusRoute.fromGeoJson(Map<String, dynamic> json) {
    final feature = json.containsKey('data') && json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;

    final properties = (feature['properties'] as Map<String, dynamic>?) ?? {};
    final geometry = (feature['geometry'] as Map<String, dynamic>?) ?? {};
    final rawCoords = (geometry['coordinates'] as List<dynamic>?) ?? [];

    final distance = (properties['distance_meters'] as num?)?.toDouble() ?? 0.0;

    final List<LatLng> latLngList = [];
    final List<List<double>> coordinateList = [];

    for (final item in rawCoords) {
      if (item is List && item.length >= 2) {
        final lng = (item[0] as num).toDouble();
        final lat = (item[1] as num).toDouble();
        coordinateList.add([lng, lat]);
        latLngList.add(LatLng(lat, lng));
      }
    }

    return CampusRoute(
      distanceMeters: distance,
      points: latLngList,
      rawCoordinates: coordinateList,
      rawFeature: feature,
    );
  }

  Map<String, dynamic> toGeoJsonFeatureCollection() {
    return {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {
            'distance_meters': distanceMeters,
          },
          'geometry': {
            'type': 'LineString',
            'coordinates': rawCoordinates,
          },
        },
      ],
    };
  }
}
