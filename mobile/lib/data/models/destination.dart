class Destination {
  final String id;
  final String roomId;
  final String name;
  final String category;
  final double latitude;
  final double longitude;
  final List<String> tags;

  const Destination({
    required this.id,
    required this.roomId,
    required this.name,
    required this.category,
    required this.latitude,
    required this.longitude,
    this.tags = const [],
  });

  factory Destination.fromJson(Map<String, dynamic> json) {
    return Destination(
      id: json['id'] as String,
      roomId: (json['room_id'] ?? json['roomId']) as String,
      name: json['name'] as String,
      category: (json['category'] ?? 'academic') as String,
      latitude: (json['lat'] ?? json['latitude'] as num).toDouble(),
      longitude: (json['lng'] ?? json['longitude'] as num).toDouble(),
      tags: (json['tags'] as List<dynamic>?)?.map((t) => t.toString()).toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
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
