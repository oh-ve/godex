export const parseLocation = (
  location: string | null
): { lat: number; lng: number } | null => {
  if (!location) return null;

  const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
  if (!match) return null;

  const [, lng, lat] = match;
  return { lat: parseFloat(lat), lng: parseFloat(lng) };
};
