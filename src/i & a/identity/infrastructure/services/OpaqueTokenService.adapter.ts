import crypto from "crypto";
import type { TokenServicePort } from "../../application/ports/services/TokenService.port.js";

class OpaqueTokenServiceAdapter implements TokenServicePort {
    constructor() {}

    /**
     * Generates a cryptographically strong random string.
     * 32 bytes of entropy results in a 64-character hex string.
     */
    generate(): string {
        return crypto.randomBytes(32).toString("hex");
    }

    /**
     * In the Opaque pattern, 'decode' is actually a 'lookup'.
     * This implementation assumes your Use Case or Repository handles the DB check.
     * If your Port requires this adapter to do the lookup, you'd inject a Repository here.
     */
    validateToken(token: string): boolean {
        // Basic check to ensure it's a 64-char hex string before hitting the DB
        const hexRegex = /^[0-9a-f]{64}$/i;
        if (!hexRegex.test(token)) {
            return false;
        }

        return true;
    }
}

export default OpaqueTokenServiceAdapter;