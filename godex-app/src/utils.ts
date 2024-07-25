export const parseLocation = (
  location: string | null
): { lat: number; lng: number } | null => {
  if (!location) return null;

  const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
  if (!match) return null;

  const [, lng, lat] = match;
  return { lat: parseFloat(lat), lng: parseFloat(lng) };
};

export const capitalize = (s: string) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};
