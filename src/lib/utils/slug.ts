export function getInfluencerSlug(displayName: string): string {
  if (!displayName) return "";
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
