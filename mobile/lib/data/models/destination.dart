class Destination {
  final String id;
  final String routingNodeId;
  final String name;
  final String category;
  final double latitude;
  final double longitude;
  final List<String> tags;

  String get roomId => routingNodeId;

  const Destination({
    required this.id,
    String? routingNodeId,
    String? roomId,
    required this.name,
    required this.category,
    required this.latitude,
    required this.longitude,
    this.tags = const [],
  }) : routingNodeId = routingNodeId ?? roomId ?? id;

  factory Destination.fromJson(Map<String, dynamic> json) {
    final geom = json['geom'] as Map<String, dynamic>?;
    final coords = (geom?['coordinates'] as List<dynamic>?);

    final double lat = coords != null && coords.length >= 2
        ? (coords[1] as num).toDouble()
        : (json['lat'] ?? json['latitude'] as num?)?.toDouble() ?? 0.0;

    final double lng = coords != null && coords.length >= 2
        ? (coords[0] as num).toDouble()
        : (json['lng'] ?? json['longitude'] as num?)?.toDouble() ?? 0.0;

    final node = (json['routing_node_id'] ??
            json['routingNodeId'] ??
            json['room_id'] ??
            json['roomId'] ??
            json['id'] ??
            '') as String;

    return Destination(
      id: json['id'] as String,
      routingNodeId: node,
      name: json['name'] as String,
      category: (json['type'] ?? json['category'] ?? 'destination') as String,
      latitude: lat,
      longitude: lng,
      tags: (json['tags'] as List<dynamic>?)?.map((t) => t.toString()).toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'routing_node_id': routingNodeId,
      'room_id': roomId,
      'name': name,
      'category': category,
      'latitude': latitude,
      'longitude': longitude,
      'tags': tags,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Destination &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => '$name ($roomId)';
}
