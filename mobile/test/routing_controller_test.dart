import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:uniway_mobile/data/models/campus_route.dart';
import 'package:uniway_mobile/data/models/destination.dart';
import 'package:uniway_mobile/data/repositories/routing_repository.dart';
import 'package:uniway_mobile/presentation/controllers/routing_controller.dart';

class MockRoutingRepository implements RoutingRepository {
  bool shouldSucceed = true;
  bool destinationsShouldSucceed = true;
  List<Destination> mockDestinations = [];
  int routeDelayMs = 0;

  @override
  Future<DestinationsResult> getDestinations({required String campusId}) async {
    if (destinationsShouldSucceed) {
      return DestinationsResult(
        destinations: mockDestinations,
        statusCode: 200,
      );
    }
    return const DestinationsResult(
      destinations: [],
      errorMessage: 'Network error loading destinations',
      statusCode: 500,
    );
  }

  @override
  Future<RoutingResult> getRoute({
    required String campusId,
    required Destination origin,
    required Destination destination,
    bool accessible = false,
  }) async {
    if (routeDelayMs > 0) {
      await Future<void>.delayed(Duration(milliseconds: routeDelayMs));
    }

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
  group('RoutingController State & Async Safety Tests', () {
    late MockRoutingRepository mockRepo;
    late RoutingController controller;

    final defaultTestDestinations = [
      const Destination(
        id: 'DEST_1',
        routingNodeId: 'OUT_DOME_0_001',
        name: 'Dome Entrance',
        category: 'academic',
        latitude: 26.843,
        longitude: 75.565,
      ),
      const Destination(
        id: 'DEST_2',
        routingNodeId: 'OUT_AB1_0_001',
        name: 'AB1 Entrance',
        category: 'academic',
        latitude: 26.844,
        longitude: 75.566,
      ),
    ];

    setUp(() {
      mockRepo = MockRoutingRepository();
      mockRepo.mockDestinations = defaultTestDestinations;
      controller = RoutingController(repository: mockRepo);
    });

    tearDown(() {
      if (!controller.isDisposed) {
        controller.dispose();
      }
    });

    test('initializes cleanly and populates destinations dynamically', () async {
      await Future<void>.delayed(Duration.zero);

      expect(controller.destinations.length, 2);
      expect(controller.origin, isNotNull);
      expect(controller.destination, isNotNull);
      expect(controller.canGo, isTrue);
    });

    test('failed destination loading disables Go and exposes error state', () async {
      mockRepo.destinationsShouldSucceed = false;

      await controller.loadDestinations();

      expect(controller.destinations, isEmpty);
      expect(controller.destinationsError, contains('Network error loading destinations'));
      expect(controller.canGo, isFalse);
      expect(controller.origin, isNull);
      expect(controller.destination, isNull);
    });

    test('empty destination response leaves empty list and disables Go', () async {
      mockRepo.mockDestinations = [];

      await controller.loadDestinations();

      expect(controller.destinations, isEmpty);
      expect(controller.canGo, isFalse);
      expect(controller.origin, isNull);
      expect(controller.destination, isNull);
    });

    test('replacing a 7-item list with a different 7-item list increments revision and updates identity', () async {
      final listA = List.generate(
        7,
        (i) => Destination(
          id: 'A_$i',
          routingNodeId: 'OUT_A_$i',
          name: 'Point A$i',
          category: 'test',
          latitude: 26.840 + (i * 0.001),
          longitude: 75.560 + (i * 0.001),
        ),
      );

      final listB = List.generate(
        7,
        (i) => Destination(
          id: 'B_$i',
          routingNodeId: 'OUT_B_$i',
          name: 'Point B$i',
          category: 'test',
          latitude: 26.850 + (i * 0.001),
          longitude: 75.570 + (i * 0.001),
        ),
      );

      mockRepo.mockDestinations = listA;
      await controller.loadDestinations();
      final initialRevision = controller.destinationsRevision;
      expect(controller.destinations.first.id, 'A_0');

      mockRepo.mockDestinations = listB;
      await controller.loadDestinations();

      expect(controller.destinationsRevision, greaterThan(initialRevision));
      expect(controller.destinations.length, 7);
      expect(controller.destinations.first.id, 'B_0');
      expect(controller.destinations.first.routingNodeId, 'OUT_B_0');
    });

    test('ignores out-of-order route responses', () async {
      await Future<void>.delayed(Duration.zero);

      mockRepo.routeDelayMs = 60;
      final slowRouteFuture = controller.fetchRoute();

      mockRepo.routeDelayMs = 0;
      controller.setDestination(defaultTestDestinations.last);
      final fastRouteFuture = controller.fetchRoute();

      await fastRouteFuture;
      expect(controller.currentRoute, isNotNull);

      await slowRouteFuture;
      expect(controller.currentRoute, isNotNull);
      expect(controller.destination, equals(defaultTestDestinations.last));
    });

    test('clearing route cancels pending in-flight route resolution', () async {
      await Future<void>.delayed(Duration.zero);

      mockRepo.routeDelayMs = 50;
      final pendingFuture = controller.fetchRoute();
      expect(controller.isLoading, isTrue);

      controller.clearRoute();
      expect(controller.currentRoute, isNull);

      await pendingFuture;
      expect(controller.currentRoute, isNull);
    });

    test('dispose cancels pending route completions without throwing', () async {
      await Future<void>.delayed(Duration.zero);

      mockRepo.routeDelayMs = 50;
      final pendingFuture = controller.fetchRoute();

      controller.dispose();
      expect(controller.isDisposed, isTrue);

      await expectLater(pendingFuture, completes);
    });
  });
}
