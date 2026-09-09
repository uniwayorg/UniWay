# QGIS routing node import

Migration 00007 adds routing_nodes alongside existing room-based routing.
It can run on a populated database without changing existing edges or reports.
Ley supplies the transaction; rollback refuses to delete populated nodes.

RoutingNodesFileSchema validates the QGIS FeatureCollection. The importer must
supply campus_id, convert geometry to PostGIS geom, and preserve node_id text
including zero padding. The database enforces uniqueness within each campus.

RoutingEdgeSchema remains the live UUID/room-based edge contract.
QgisRoutingEdgeSchema describes the separate QGIS import shape; routing_edges
does not store that shape yet. Campus and edge IDs remain UUIDs; QGIS node IDs
are used directly, with no generated node UUID.

Switching live routing requires a coordinated follow-up: map existing data,
change edge foreign keys, update spatial queries, include campus in cache keys,
and update API parameters, seeds, fixtures and mobile destinations. Do not point
the current API at QGIS edges until those consumers have been migrated.
