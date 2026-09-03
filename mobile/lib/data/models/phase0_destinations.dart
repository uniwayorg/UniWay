import 'destination.dart';

class Phase0Destinations {
  static const List<Destination> all = [
    Destination(
      id: '50000000-0000-4000-8000-000000000001',
      roomId: '30000000-0000-4000-8000-000000000001',
      name: 'Academic Block 1 (AB1)',
      category: 'academic',
      latitude: 26.842601,
      longitude: 75.564172,
      tags: ['ab1', 'classes', 'labs', 'engineering'],
    ),
    Destination(
      id: '50000000-0000-4000-8000-000000000002',
      roomId: '30000000-0000-4000-8000-000000000002',
      name: 'Academic Block 2 (AB2)',
      category: 'academic',
      latitude: 26.842802,
      longitude: 75.565953,
      tags: ['ab2', 'classes', 'labs'],
    ),
    Destination(
      id: '50000000-0000-4000-8000-000000000003',
      roomId: '30000000-0000-4000-8000-000000000003',
      name: 'Academic Block 3 (AB3)',
      category: 'academic',
      latitude: 26.843791,
      longitude: 75.564293,
      tags: ['ab3', 'classes', 'labs'],
    ),
    Destination(
      id: '50000000-0000-4000-8000-000000000004',
      roomId: '30000000-0000-4000-8000-000000000004',
      name: 'Old Mess (Food Court)',
      category: 'amenity',
      latitude: 26.843022,
      longitude: 75.565352,
      tags: ['mess', 'food court', 'cafeteria', 'food'],
    ),
    Destination(
      id: '50000000-0000-4000-8000-000000000005',
      roomId: '30000000-0000-4000-8000-000000000005',
      name: 'Central Library',
      category: 'academic',
      latitude: 26.842477,
      longitude: 75.566790,
      tags: ['library', 'books', 'study', 'reading'],
    ),
    Destination(
      id: '50000000-0000-4000-8000-000000000006',
      roomId: '30000000-0000-4000-8000-000000000006',
      name: 'Dome Building',
      category: 'academic',
      latitude: 26.841644,
      longitude: 75.565771,
      tags: ['dome', 'admin', 'central', 'administration'],
    ),
    Destination(
      id: '50000000-0000-4000-8000-000000000007',
      roomId: '30000000-0000-4000-8000-000000000007',
      name: 'Lecture Hall Complex (LHC)',
      category: 'academic',
      latitude: 26.844382,
      longitude: 75.564676,
      tags: ['lhc', 'lecture hall', 'auditorium'],
    ),
  ];

  static Map<String, dynamic> toGeoJsonFeatureCollection() {
    return {
      'type': 'FeatureCollection',
      'features': all.map((d) {
        return {
          'type': 'Feature',
          'id': d.id,
          'properties': {
            'id': d.id,
            'name': d.name,
            'room_id': d.roomId,
            'category': d.category,
          },
          'geometry': {
            'type': 'Point',
            'coordinates': [d.longitude, d.latitude],
          },
        };
      }).toList(),
    };
  }
}
