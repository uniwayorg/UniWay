import 'package:flutter/foundation.dart';
import '../../core/constants/campus_constants.dart';
import '../../data/models/campus_route.dart';
import '../../data/models/destination.dart';
import '../../data/models/phase0_destinations.dart';
import '../../data/repositories/routing_repository.dart';

class RoutingController extends ChangeNotifier {
  final RoutingRepository _repository;
  final String campusId;

  final List<Destination> _destinations = Phase0Destinations.all;
  Destination? _origin;
  Destination? _destination;
  CampusRoute? _currentRoute;
  bool _isLoading = false;
  String? _errorMessage;
  int? _statusCode;
  int? _latencyMs;
  bool _accessibleOnly = false;

  RoutingController({
    RoutingRepository? repository,
    this.campusId = CampusConstants.syntheticCampusId,
  }) : _repository = repository ?? RoutingRepository() {
    if (_destinations.length >= 2) {
      _origin = _destinations.firstWhere(
        (d) => d.name.contains('Dome'),
        orElse: () => _destinations[0],
      );
      _destination = _destinations.firstWhere(
        (d) => d.name.contains('AB1'),
        orElse: () => _destinations[1],
      );
    }
  }

  List<Destination> get destinations => _destinations;
  Destination? get origin => _origin;
  Destination? get destination => _destination;
  CampusRoute? get currentRoute => _currentRoute;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int? get statusCode => _statusCode;
  int? get latencyMs => _latencyMs;
  bool get accessibleOnly => _accessibleOnly;
  bool get canGo => _origin != null && _destination != null && _origin != _destination;

  void setOrigin(Destination? newOrigin) {
    if (_origin == newOrigin) return;
    _origin = newOrigin;
    final hadRoute = _currentRoute != null;
    _clearActiveRoute();
    notifyListeners();
    if (hadRoute && _origin != null && _destination != null) {
      fetchRoute();
    }
  }

  void setDestination(Destination? newDestination) {
    if (_destination == newDestination) return;
    _destination = newDestination;
    final hadRoute = _currentRoute != null;
    _clearActiveRoute();
    notifyListeners();
    if (hadRoute && _origin != null && _destination != null) {
      fetchRoute();
    }
  }

  void setAccessibleOnly(bool value) {
    if (_accessibleOnly == value) return;
    _accessibleOnly = value;
    notifyListeners();
    if (_currentRoute != null) {
      fetchRoute();
    }
  }

  void swap() {
    if (_origin == null || _destination == null) return;
    final temp = _origin;
    _origin = _destination;
    _destination = temp;
    _clearActiveRoute();
    notifyListeners();
    fetchRoute();
  }

  Future<void> fetchRoute() async {
    if (_origin == null || _destination == null) return;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _repository.getRoute(
      campusId: campusId,
      origin: _origin!,
      destination: _destination!,
      accessible: _accessibleOnly,
    );

    _isLoading = false;
    _statusCode = result.statusCode;
    _latencyMs = result.latencyMs;

    if (result.isSuccess) {
      _currentRoute = result.route;
      _errorMessage = null;
    } else {
      _currentRoute = null;
      _errorMessage = result.errorMessage;
    }

    notifyListeners();
  }

  void clearRoute() {
    _clearActiveRoute();
    notifyListeners();
  }

  void _clearActiveRoute() {
    _currentRoute = null;
    _errorMessage = null;
    _statusCode = null;
    _latencyMs = null;
  }

  @override
  void dispose() {
    _repository.dispose();
    super.dispose();
  }
}
