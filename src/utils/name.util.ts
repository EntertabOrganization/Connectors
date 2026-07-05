export function splitFullName(fullName: string): { firstName?: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { lastName: "Unknown" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]
  };
}
