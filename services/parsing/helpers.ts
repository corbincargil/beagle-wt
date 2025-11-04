/**
 * Parses a dollar amount string (e.g., "$2,500.00") to a number
 */
const parseDollarAmount = (value?: string): number | undefined => {
    if (!value || value.trim() === "") return undefined;
    const cleaned = value.replace(/[$,]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
}

/**
 * Constructs a full property address from address components
 */
const buildPropertyAddress = (
    street?: string,
    city?: string,
    state?: string,
    zip?: string
): string | undefined => {
    const parts = [street, city, state, zip].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Normalizes status to match ClaimRecord type ("posted" | "declined")
 */
const normalizeStatus = (status?: string): "posted" | "declined" | undefined => {
    if (!status) return undefined;
    const normalized = status.toLowerCase().trim();
    if (normalized === "posted") return "posted";
    if (normalized === "declined") return "declined";
    return undefined;
}

export { parseDollarAmount, buildPropertyAddress, normalizeStatus };