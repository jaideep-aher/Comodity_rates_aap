// Thin wrapper around expo-location so callers stay blissfully ignorant of
// whether the native module is bundled. Returns null on any failure —
// the UI always has a village-picker fallback.

type LocationModule = {
  requestForegroundPermissionsAsync: () => Promise<{ status: string }>;
  getLastKnownPositionAsync: () => Promise<{ coords: { latitude: number; longitude: number } } | null>;
  getCurrentPositionAsync: (opts?: unknown) => Promise<{ coords: { latitude: number; longitude: number } }>;
  reverseGeocodeAsync?: (
    coords: { latitude: number; longitude: number },
  ) => Promise<Array<{ postalCode?: string | null; district?: string | null; subregion?: string | null; city?: string | null }>>;
};

let _mod: LocationModule | null | undefined;
function load(): LocationModule | null {
  if (_mod !== undefined) return _mod;
  try {
    _mod = require('expo-location') as LocationModule;
  } catch {
    _mod = null;
  }
  return _mod;
}

export function isLocationAvailable(): boolean {
  return load() !== null;
}

export type GpsCoords = { lat: number; lng: number };

export type RequestResult = {
  status: 'granted' | 'denied' | 'unavailable';
  coords: GpsCoords | null;
};

// Asks for location permission and (if granted) returns a fresh fix.
// Use this for proactive prompts at onboarding / first-launch.
export async function requestLocation(): Promise<RequestResult> {
  const mod = load();
  if (!mod) return { status: 'unavailable', coords: null };
  try {
    const perm = await mod.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { status: 'denied', coords: null };
    const last = await mod.getLastKnownPositionAsync();
    if (last?.coords) {
      return {
        status: 'granted',
        coords: { lat: last.coords.latitude, lng: last.coords.longitude },
      };
    }
    const fresh = await mod.getCurrentPositionAsync();
    return {
      status: 'granted',
      coords: { lat: fresh.coords.latitude, lng: fresh.coords.longitude },
    };
  } catch {
    return { status: 'denied', coords: null };
  }
}

// Returns last-known coords if present, else requests a fresh fix. Null if
// permission is denied, the module isn't bundled, or the OS is slow.
export async function getCurrentCoords(): Promise<GpsCoords | null> {
  const res = await requestLocation();
  return res.coords;
}

export async function reversePincode(coords: GpsCoords): Promise<string | null> {
  const mod = load();
  if (!mod?.reverseGeocodeAsync) return null;
  try {
    const res = await mod.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lng,
    });
    return res[0]?.postalCode ?? null;
  } catch {
    return null;
  }
}
