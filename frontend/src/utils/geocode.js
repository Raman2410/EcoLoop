const cache = new Map();

const tryFetch = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.length) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
};

export const geocodeAddress = async (address, area) => {
  if (!address?.trim()) return null;

  const key = `${address}|${area}`.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  try {
    // Attempt 1 — full address + area + India
    let coords = await tryFetch(`${address}, ${area}, India`);

    // Attempt 2 — just area + India
    if (!coords && area) {
      coords = await tryFetch(`${area}, India`);
    }

    // Attempt 3 — just area alone
    if (!coords && area) {
      coords = await tryFetch(area);
    }

    cache.set(key, coords);
    return coords;
  } catch (err) {
    console.error("[Geocode] Failed:", err);
    return null;
  }
};
