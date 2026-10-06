export interface Place {
  street?: string;
  area?: string;
  pincode?: string;
}

/** Turns a map position into a street / area / pincode using OpenStreetMap's free address lookup (best effort). */
export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`
    );
    if (!res.ok) return {};
    const a = (await res.json()).address ?? {};
    return {
      street: a.road || a.pedestrian || a.residential || undefined,
      area: a.suburb || a.neighbourhood || a.quarter || a.city_district || a.village || undefined,
      pincode: /^\d{6}$/.test(a.postcode ?? "") ? a.postcode : undefined,
    };
  } catch {
    return {};
  }
}
