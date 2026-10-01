/**
 * Utility to determine the default landing path for a user based on their role and permissions.
 */
export function getDefaultAllowedPath(user: any): string {
    if (!user) return "/login";
    if (user.role === "Guest") return "/qr-scanner";
    if (user.role === "Admin") return "/dashboard";
    if (user.role === "Vendor") return "/stores";

    const allowed: string[] = Array.isArray(user.allowedPages) ? user.allowedPages : [];

    // Standard primary routes in priority order
    if (allowed.includes("/dashboard")) return "/dashboard";
    if (allowed.includes("/projects")) return "/projects";
    if (allowed.includes("/stores")) return "/stores";
    if (allowed.includes("/tools")) {
        const firstStore = user.stores?.[0];
        const storeId = typeof firstStore === "object" ? firstStore?._id : firstStore;
        return storeId ? `/stores/${storeId}/tools` : "/stores";
    }
    if (allowed.includes("/challans") || allowed.includes("/challans/history")) return "/challans/history";
    if (allowed.includes("/scrap") || allowed.includes("/tools/scrap")) return "/tools/scrap";
    if (allowed.includes("/reports")) return "/reports";
    if (allowed.includes("/users")) return "/users";
    if (allowed.includes("/settings")) return "/settings";

    // If any custom path exists, navigate there
    const validCustom = allowed.find((p) => typeof p === "string" && p.startsWith("/"));
    if (validCustom) return validCustom;

    return "/no-access";
}
