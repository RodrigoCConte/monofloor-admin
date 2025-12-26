/**
 * Geofencing Service
 * Calculates distances using Haversine formula and validates location boundaries
 */

// Earth radius in meters
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Check if user is outside the project geofence area
 * @returns true if outside, false if inside
 */
export function isOutOfArea(
  userLat: number,
  userLng: number,
  projectLat: number,
  projectLng: number,
  radiusMeters: number = 70
): boolean {
  const distance = calculateDistance(userLat, userLng, projectLat, projectLng);
  return distance > radiusMeters;
}

/**
 * Get geofence status with detailed info
 */
export function getGeofenceStatus(
  userLat: number,
  userLng: number,
  projectLat: number | null,
  projectLng: number | null,
  radiusMeters: number = 70
): {
  isOutOfArea: boolean;
  distance: number | null;
  radiusMeters: number;
} {
  // If project doesn't have coordinates, can't check
  if (projectLat === null || projectLng === null) {
    return {
      isOutOfArea: false,
      distance: null,
      radiusMeters,
    };
  }

  const distance = calculateDistance(userLat, userLng, projectLat, projectLng);

  return {
    isOutOfArea: distance > radiusMeters,
    distance,
    radiusMeters,
  };
}

/**
 * Determine if device was turned off intentionally based on battery level
 * @returns 'intentional' | 'low_battery' | 'unknown'
 */
export function detectShutdownReason(
  lastBatteryLevel: number | null,
  minutesSinceLastUpdate: number
): 'intentional' | 'low_battery' | 'unknown' {
  if (lastBatteryLevel === null) {
    return 'unknown';
  }

  // If battery was above 15% and stopped sending, likely intentional
  if (lastBatteryLevel > 15 && minutesSinceLastUpdate > 5) {
    return 'intentional';
  }

  // If battery was very low, it likely died
  if (lastBatteryLevel <= 5) {
    return 'low_battery';
  }

  return 'unknown';
}
