import { mockPolygon, mockPoint, mockRoomPolygon } from "./geojson";

export const CAMPUS_ID = "123e4567-e89b-12d3-a456-426614174000";
export const ENG_BLDG_ID = "123e4567-e89b-12d3-a456-426614174001";
export const SCI_BLDG_ID = "223e4567-e89b-12d3-a456-426614174001";
export const ENG_101_ID = "123e4567-e89b-12d3-a456-426614174002";
export const ENG_102_ID = "323e4567-e89b-12d3-a456-426614174002";
export const ENG_103_ID = "423e4567-e89b-12d3-a456-426614174002";
export const ENG_201_ID = "523e4567-e89b-12d3-a456-426614174002";
export const ENG_202_ID = "623e4567-e89b-12d3-a456-426614174002";
export const SCI_101_ID = "723e4567-e89b-12d3-a456-426614174002";
export const SCI_102_ID = "823e4567-e89b-12d3-a456-426614174002";
export const SCI_201_ID = "923e4567-e89b-12d3-a456-426614174002";
export const POI_CS_LECTURE_ID = "f23e4567-e89b-12d3-a456-426614174001";
export const POI_PHYSICS_LAB_ID = "a23e4567-e89b-12d3-a456-426614174001";
export const POI_CAFETERIA_ID = "b23e4567-e89b-12d3-a456-426614174001";
export const POI_FACULTY_OFFICE_ID = "c23e4567-e89b-12d3-a456-426614174001";
export const POI_CHEM_LAB_ID = "d23e4567-e89b-12d3-a456-426614174001";
export const POI_RESTROOM_ID = "e23e4567-e89b-12d3-a456-426614174001";

export const campus = {
  id: CAMPUS_ID,
  name: "Main Campus",
  bounds: mockPolygon,
};

export const engBuilding = {
  id: ENG_BLDG_ID,
  campus_id: CAMPUS_ID,
  name: "Engineering Building",
  outline: mockPolygon,
};

export const sciBuilding = {
  id: SCI_BLDG_ID,
  campus_id: CAMPUS_ID,
  name: "Science Hall",
  outline: mockPolygon,
};

export const eng101 = {
  id: ENG_101_ID,
  building_id: ENG_BLDG_ID,
  floor: "1",
  name: "101",
  geom: mockRoomPolygon,
  centroid: mockPoint,
};

export const eng102 = {
  id: ENG_102_ID,
  building_id: ENG_BLDG_ID,
  floor: "1",
  name: "102",
  geom: mockRoomPolygon,
  centroid: mockPoint,
};

export const eng103 = {
  id: ENG_103_ID,
  building_id: ENG_BLDG_ID,
  floor: "1",
  name: "103",
  geom: mockRoomPolygon,
  centroid: mockPoint,
};

export const eng201 = {
  id: ENG_201_ID,
  building_id: ENG_BLDG_ID,
  floor: "2",
  name: "201",
  geom: mockRoomPolygon,
  centroid: mockPoint,
};

export const eng202 = {
  id: ENG_202_ID,
  building_id: ENG_BLDG_ID,
  floor: "2",
  name: "202",
  geom: mockRoomPolygon,
  centroid: mockPoint,
};

export const sci101 = {
  id: SCI_101_ID,
  building_id: SCI_BLDG_ID,
  floor: "1",
  name: "101",
  geom: mockRoomPolygon,
  centroid: mockPoint,
};

export const sci102 = {
  id: SCI_102_ID,
  building_id: SCI_BLDG_ID,
  floor: "1",
  name: "102",
  geom: mockRoomPolygon,
  centroid: mockPoint,
};

export const sci201 = {
  id: SCI_201_ID,
  building_id: SCI_BLDG_ID,
  floor: "2",
  name: "201",
  geom: mockRoomPolygon,
  centroid: mockPoint,
};

export const buildings = [engBuilding, sciBuilding];

export const rooms = [eng101, eng102, eng103, eng201, eng202, sci101, sci102, sci201];

export const csLecturePoi = {
  id: POI_CS_LECTURE_ID,
  room_id: ENG_101_ID,
  name: "CS Lecture Hall",
  category: "lecture_hall",
  tags: ["computers", "projector"],
};

export const physicsLabPoi = {
  id: POI_PHYSICS_LAB_ID,
  room_id: ENG_102_ID,
  name: "Physics Lab",
  category: "lab",
  tags: ["microscopes", "sensors"],
};

export const cafeteriaPoi = {
  id: POI_CAFETERIA_ID,
  room_id: ENG_103_ID,
  name: "Cafeteria",
  category: "cafeteria",
  tags: ["food", "seating"],
};

export const facultyOfficePoi = {
  id: POI_FACULTY_OFFICE_ID,
  room_id: ENG_201_ID,
  name: "Faculty Office",
  category: "office",
  tags: ["desk", "meeting"],
};

export const chemLabPoi = {
  id: POI_CHEM_LAB_ID,
  room_id: SCI_101_ID,
  name: "Chemistry Lab",
  category: "lab",
  tags: ["fumehood", "beakers"],
};

export const restroomPoi = {
  id: POI_RESTROOM_ID,
  room_id: SCI_102_ID,
  name: "Restroom",
  category: "restroom",
  tags: ["accessible"],
};

export const pois = [csLecturePoi, physicsLabPoi, cafeteriaPoi, facultyOfficePoi, chemLabPoi, restroomPoi];
