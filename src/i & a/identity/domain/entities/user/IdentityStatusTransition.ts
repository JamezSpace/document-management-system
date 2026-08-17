import DomainError from "../../../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../../../shared/errors/enum/domain.enum.js";
import { IdentityStatus } from "./IdentityStatus.js";


/**
 * Enforces business rules for state transitions within the Identity lifecycle.
 */
class IdentityTransition {
    /**
     * Users can only be activated if they are currently PENDING or SUSPENDED.
     */
    static assertCanActivate(currentState: IdentityStatus) {
        const validInitialStates = [IdentityStatus.PENDING, IdentityStatus.SUSPENDED];
        
        if (!validInitialStates.includes(currentState)) {
            throw new DomainError(
                GlobalDomainErrors.identity_authority.identity.INVALID_STATE_TRANSITION,
                { currentState, targetState: IdentityStatus.ACTIVE }
            );
        }
    }

    /**
     * Only ACTIVE users can be suspended (e.g., during a disciplinary query).
     */
    static assertCanSuspend(currentState: IdentityStatus) {
        if (currentState !== IdentityStatus.ACTIVE) {
            throw new DomainError(
                GlobalDomainErrors.identity_authority.identity.USER_NOT_ACTIVE,
                { currentState, targetState: IdentityStatus.SUSPENDED }
            );
        }
    }

    /**
     * Transitions a user to RETIRED. Usually only from ACTIVE.
     * Note: Retired users often keep "Read-Only" access.
     */
    static assertCanRetire(currentState: IdentityStatus) {
        if (currentState !== IdentityStatus.ACTIVE) {
            throw new DomainError(
                GlobalDomainErrors.identity_authority.identity.INVALID_STATE_TRANSITION,
                { currentState, targetState: IdentityStatus.RETIRED }
            );
        }
    }

    /**
     * RESIGNED and TERMINATED are typically terminal states.
     * You cannot resign if you are already terminated or retired.
     */
    static assertCanResign(currentState: IdentityStatus) {
        if (currentState !== IdentityStatus.ACTIVE && currentState !== IdentityStatus.SUSPENDED) {
            throw new DomainError(
                GlobalDomainErrors.identity_authority.identity.INVALID_STATE_TRANSITION,
                { currentState, targetState: IdentityStatus.RESIGNED }
            );
        }
    }

    /**
     * TERMINATED is a forced end-of-service. Can happen from almost any state
     * except already being terminated or resigned.
     */
    static assertCanTerminate(currentState: IdentityStatus) {
        const terminalStates = [IdentityStatus.TERMINATED, IdentityStatus.RESIGNED];
        
        if (terminalStates.includes(currentState)) {
            throw new DomainError(
                GlobalDomainErrors.identity_authority.identity.INVALID_STATE_TRANSITION,
                { currentState, targetState: IdentityStatus.TERMINATED }
            );
        }
    }
}

export default IdentityTransition;