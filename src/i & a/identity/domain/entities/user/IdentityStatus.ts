/**
 * This enumerates all the states of a user. Refer to the "state machine" for more information on this.
 */
enum IdentityStatus {
    PENDING = "pending",     // Account created, not yet verified
    ACTIVE = "active",       // Full access
    SUSPENDED = "suspended", // Temporary lock (e.g., query/disciplinary)
    RETIRED = "retired",     // Read-only access (often for life)
    RESIGNED = "resigned",   // No access
    TERMINATED = "terminated" // No access, blacklisted
}

export { IdentityStatus };
