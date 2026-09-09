import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:uniway_mobile/data/models/campus_route.dart';
import 'package:uniway_mobile/data/models/phase0_destinations.dart';

void main() {
  group('CampusRoute Model Tests', () {
    test('parses synthetic GeoJSON route response correctly', () {
      final backendJson = {
        'success': true,
        'data': {
          'type': 'Feature',
          'properties': {
            'distance_meters': 355.0,
          },
          'geometry': {
            'type': 'LineString',
            'coordinates': [
              [75.5625, 26.8435],
              [75.5640, 26.8440],
              [75.5645, 26.8455],
            ],
          },
        },
      };

      final route = CampusRoute.fromGeoJson(backendJson);

      expect(route.distanceMeters, 355.0);
      expect(route.formattedDistance, '355.0 m');
      expect(route.points.length, 3);

      expect(route.points[0].latitude, closeTo(26.8435, 0.0001));
      expect(route.points[0].longitude, closeTo(75.5625, 0.0001));

      expect(route.points[2].latitude, closeTo(26.8455, 0.0001));
      expect(route.points[2].longitude, closeTo(75.5645, 0.0001));
    });

    test('generates valid GeoJSON FeatureCollection', () {
      const route = CampusRoute(
        distanceMeters: 120.5,
        points: [LatLng(26.84, 75.56), LatLng(26.85, 75.57)],
        rawCoordinates: [
          [75.56, 26.84],
          [75.57, 26.85],
        ],
        rawFeature: {},
      );

      final fc = route.toGeoJsonFeatureCollection();
      expect(fc['type'], 'FeatureCollection');
      final features = fc['features'] as List<dynamic>;
      expect(features.length, 1);
      expect(features[0]['geometry']['type'], 'LineString');
    });
  });

  group('Phase 0 Destinations Tests', () {
    test('contains all 7 Phase 0 destinations', () {
      expect(Phase0Destinations.all.length, 7);

      final names = Phase0Destinations.all.map((d) => d.name).toList();
      expect(names.any((n) => n.contains('Academic Block 1')), isTrue);
      expect(names.any((n) => n.contains('Academic Block 2')), isTrue);
      expect(names.any((n) => n.contains('Academic Block 3')), isTrue);
      expect(names.any((n) => n.contains('Old Mess')), isTrue);
      expect(names.any((n) => n.contains('Library')), isTrue);
      expect(names.any((n) => n.contains('Dome Building')), isTrue);
      expect(names.any((n) => n.contains('Lecture Hall Complex')), isTrue);
    });

    test('destinations serializes to valid GeoJSON FeatureCollection', () {
      final fc = Phase0Destinations.toGeoJsonFeatureCollection();
      expect(fc['type'], 'FeatureCollection');
      final features = fc['features'] as List<dynamic>;
      expect(features.length, 7);
      expect(features.first['geometry']['type'], 'Point');
    });
  });
}
