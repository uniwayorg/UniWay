# MUJ QGIS dataset

Source: routing_nodes.geojson exported September 5, 2026, plus routing_edges.geojson
and destinations.geojson from the supplied uniway_geojson directory.

The node file is unchanged. Edge/destination references were translated from the
older node names to the new OUT_LOC_FLOOR_NID names using unique nid values.
Every old/new node geometry matched exactly before this translation. Original
Downloads files were not modified. Edge IDs (E00001 etc.) and destination IDs
(DEST_01 etc.) remain text; edge_type is walkway in this export.

Run: bun scripts/check-campus-data.ts

Known issues are warnings, not import blockers. E00143 has Point geometry, connecting
OUT_AB2_0_109 and OUT_AB2_0_083 at identical coordinates. It claims a distance
of approximately 0.005 metres. Preserve this geometry, distance and both nodes
unchanged; source corrections are deferred to a later iteration.

Nodes OUT_AB3_0_114 and OUT_AB3_0_115 form a disconnected two-node
component. Do not invent a connecting walkway without source data.

All 118 nodes, 153 edges and 7 destinations pass validation with warnings.
Including every edge leaves components of 116 and 2 nodes. No records are
excluded. Duplicate identities and missing references remain errors.

The check does not write to the database. Storage and importing are a separate
change; they must preserve Point geometry as well as LineString geometry.
