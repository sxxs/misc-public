export function halftonePatternUri(
  dotColor = "white",
  opacity = 0.04,
  size = 10
): string {
  const r = size * 0.22;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${dotColor}" opacity="${opacity}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function scanlineGradient(opacity = 0.12): string {
  return `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,${opacity}) 3px, rgba(0,0,0,${opacity}) 4px)`;
}
