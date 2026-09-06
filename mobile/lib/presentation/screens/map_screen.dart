import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import '../../core/constants/map_constants.dart';
import '../../data/models/campus_route.dart';
import '../controllers/routing_controller.dart';
import '../widgets/debug_panel.dart';
import '../widgets/route_picker_card.dart';
import '../widgets/route_status_banner.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late final RoutingController _controller;
  MapLibreMapController? _mapController;
  Line? _activeRouteLine;
  Line? _activeRouteCasing;
  final List<Circle> _destinationCircles = [];
  final List<Symbol> _destinationSymbols = [];
  bool _styleLoaded = false;

  @override
  void initState() {
    super.initState();
    _controller = RoutingController();
    _controller.addListener(_onRoutingStateChanged);
  }

  @override
  void dispose() {
    _controller.removeListener(_onRoutingStateChanged);
    _controller.dispose();
    super.dispose();
  }

  void _onMapCreated(MapLibreMapController controller) {
    _mapController = controller;
  }

  void _onStyleLoaded() async {
    _styleLoaded = true;
    await _renderDestinationMarkers();
  }

  Future<void> _renderDestinationMarkers() async {
    final map = _mapController;
    if (map == null) return;

    for (final circle in _destinationCircles) {
      await map.removeCircle(circle);
    }
    _destinationCircles.clear();

    for (final symbol in _destinationSymbols) {
      await map.removeSymbol(symbol);
    }
    _destinationSymbols.clear();

    for (final d in _controller.destinations) {
      final latLng = LatLng(d.latitude, d.longitude);

      final circle = await map.addCircle(
        CircleOptions(
          geometry: latLng,
          circleColor: '#2563EB',
          circleRadius: 7.0,
          circleStrokeWidth: 2.5,
          circleStrokeColor: '#FFFFFF',
          circleOpacity: 0.95,
        ),
      );
      _destinationCircles.add(circle);

      final symbol = await map.addSymbol(
        SymbolOptions(
          geometry: latLng,
          textField: d.name,
          textSize: 11.0,
          textColor: '#1E293B',
          textHaloColor: '#FFFFFF',
          textHaloWidth: 2.0,
          textOffset: const Offset(0, 1.2),
          textAnchor: 'top',
        ),
      );
      _destinationSymbols.add(symbol);
    }
  }

  void _onRoutingStateChanged() {
    if (!_styleLoaded || _mapController == null) return;

    if (_destinationCircles.length != _controller.destinations.length) {
      _renderDestinationMarkers();
    }

    if (_controller.currentRoute != null) {
      _drawRoute(_controller.currentRoute!);
    } else {
      _clearRoute();
    }
  }

  Future<void> _clearRoute() async {
    final map = _mapController;
    if (map == null) return;

    if (_activeRouteCasing != null) {
      await map.removeLine(_activeRouteCasing!);
      _activeRouteCasing = null;
    }
    if (_activeRouteLine != null) {
      await map.removeLine(_activeRouteLine!);
      _activeRouteLine = null;
    }
  }

  Future<void> _drawRoute(CampusRoute route) async {
    final map = _mapController;
    if (map == null || route.points.isEmpty) return;

    await _clearRoute();

    _activeRouteCasing = await map.addLine(
      LineOptions(
        geometry: route.points,
        lineColor: '#1E40AF',
        lineWidth: 8.0,
        lineOpacity: 0.5,
        lineJoin: 'round',
      ),
    );

    _activeRouteLine = await map.addLine(
      LineOptions(
        geometry: route.points,
        lineColor: '#2563EB',
        lineWidth: 5.0,
        lineOpacity: 0.95,
        lineJoin: 'round',
      ),
    );

    _fitRouteBounds(route.points);
  }

  void _fitRouteBounds(List<LatLng> points) {
    final map = _mapController;
    if (map == null || points.length < 2) return;

    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;

    for (final p in points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }

    final bounds = LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );

    map.animateCamera(
      CameraUpdate.newLatLngBounds(
        bounds,
        top: 140,
        bottom: 120,
        left: 40,
        right: 40,
      ),
    );
  }

  void _recenterMuj() {
    _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        const CameraPosition(
          target: LatLng(MapConstants.mujLatitude, MapConstants.mujLongitude),
          zoom: MapConstants.defaultZoom,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListenableBuilder(
        listenable: _controller,
        builder: (context, _) {
          return Stack(
            children: [
              MapLibreMap(
                styleString: MapConstants.openFreeMapLibertyStyle,
                initialCameraPosition: const CameraPosition(
                  target: LatLng(
                    MapConstants.mujLatitude,
                    MapConstants.mujLongitude,
                  ),
                  zoom: MapConstants.defaultZoom,
                ),
                onMapCreated: _onMapCreated,
                onStyleLoadedCallback: _onStyleLoaded,
                myLocationEnabled: false,
                trackCameraPosition: true,
                compassEnabled: true,
              ),
              SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    RoutePickerCard(controller: _controller),
                    RouteStatusBanner(controller: _controller),
                  ],
                ),
              ),
              Positioned(
                right: 16,
                bottom: 110,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FloatingActionButton.small(
                      heroTag: 'recenterMuj',
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.blue.shade800,
                      onPressed: _recenterMuj,
                      tooltip: 'Center on MUJ',
                      child: const Icon(Icons.school),
                    ),
                  ],
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 12,
                child: SafeArea(
                  child: DebugPanel(controller: _controller),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
