export function validateCoordinates(
  lng: number,
  lat: number,
  maxRadiusMeters?: number
): void {
  if (
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180 ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90
  ) {
    throw new Error(
      "Invalid parameters: lng and lat must be valid coordinates, and maxRadiusMeters must be positive."
    );
  }

  if (maxRadiusMeters !== undefined && maxRadiusMeters <= 0) {
    throw new Error(
      "Invalid parameters: lng and lat must be valid coordinates, and maxRadiusMeters must be positive."
    );
  }
}
