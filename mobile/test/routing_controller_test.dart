import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:uniway_mobile/data/models/campus_route.dart';
import 'package:uniway_mobile/data/models/destination.dart';
import 'package:uniway_mobile/data/models/phase0_destinations.dart';
import 'package:uniway_mobile/data/repositories/routing_repository.dart';
import 'package:uniway_mobile/presentation/controllers/routing_controller.dart';

class MockRoutingRepository implements RoutingRepository {
  bool shouldSucceed = true;
  List<Destination> mockDestinations = [];

  @override
  Future<List<Destination>> getDestinations({required String campusId}) async {
    return mockDestinations;
  }

  @override
  Future<RoutingResult> getRoute({
    required String campusId,
    required Destination origin,
    required Destination destination,
    bool accessible = false,
  }) async {
    if (shouldSucceed) {
      return RoutingResult(
        route: CampusRoute(
          distanceMeters: 250.0,
          points: [
            LatLng(origin.latitude, origin.longitude),
            LatLng(destination.latitude, destination.longitude),
          ],
          rawCoordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
          rawFeature: const {},
        ),
        statusCode: 200,
        latencyMs: 45,
      );
    } else {
      return const RoutingResult(
        errorMessage: 'Could not find a valid route to destination',
        statusCode: 404,
        latencyMs: 50,
      );
    }
  }

  @override
  void dispose() {}
}

void main() {
  group('RoutingController State Tests', () {
    late MockRoutingRepository mockRepo;
    late RoutingController controller;

    setUp(() {
      mockRepo = MockRoutingRepository();
      controller = RoutingController(repository: mockRepo);
    });

    tearDown(() {
      controller.dispose();
    });

    test('initializes with default Phase 0 origin and destination', () {
      expect(controller.origin, isNotNull);
      expect(controller.destination, isNotNull);
      expect(controller.origin!.name.contains('Dome'), isTrue);
      expect(controller.destination!.name.contains('AB1'), isTrue);
    });

    test('swap swaps origin and destination and triggers route fetch', () async {
      final initialOrigin = controller.origin;
      final initialDest = controller.destination;

      controller.swap();

      expect(controller.origin, equals(initialDest));
      expect(controller.destination, equals(initialOrigin));
      expect(controller.isLoading, isTrue);

      await Future<void>.delayed(Duration.zero);
      expect(controller.isLoading, isFalse);
      expect(controller.currentRoute, isNotNull);
      expect(controller.currentRoute!.distanceMeters, 250.0);
    });

    test('handles routing error gracefully', () async {
      mockRepo.shouldSucceed = false;

      await controller.fetchRoute();

      expect(controller.isLoading, isFalse);
      expect(controller.currentRoute, isNull);
      expect(controller.errorMessage, contains('Could not find a valid route'));
      expect(controller.statusCode, 404);
    });

    test('changing destination clears previous route and fetches new one', () async {
      await controller.fetchRoute();
      expect(controller.currentRoute, isNotNull);

      final newDest = Phase0Destinations.all.last;
      controller.setDestination(newDest);

      expect(controller.destination, equals(newDest));
      await Future<void>.delayed(Duration.zero);
      expect(controller.currentRoute, isNotNull);
    });

    test('loadDestinations updates destinations from repository', () async {
      mockRepo.mockDestinations = [
        const Destination(
          id: 'DEST_TEST_1',
          routingNodeId: 'NODE_TEST_1',
          name: 'Dome Entrance',
          category: 'destination',
          latitude: 26.843,
          longitude: 75.565,
        ),
        const Destination(
          id: 'DEST_TEST_2',
          routingNodeId: 'NODE_TEST_2',
          name: 'Academic Block 1',
          category: 'destination',
          latitude: 26.844,
          longitude: 75.566,
        ),
      ];

      await controller.loadDestinations();

      expect(controller.destinations.length, 2);
      expect(controller.destinations[0].id, 'DEST_TEST_1');
      expect(controller.destinations[0].routingNodeId, 'NODE_TEST_1');
      expect(controller.destinations[1].id, 'DEST_TEST_2');
    });
  });
}
