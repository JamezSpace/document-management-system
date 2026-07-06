import { StatusCodes } from "http-status-codes";

export const IdentityDomainErrors = {
    USER_NOT_ACTIVE: {
        codeName: "user_not_active",
        httpStatusCode: StatusCodes.FORBIDDEN
    },
    INVALID_STATE_TRANSITION: {
        codeName: "invalid_state_transition",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
    INCOMPLETE_REQUEST: {
        codeName: "incomplete request",
        httpStatusCode: StatusCodes.BAD_REQUEST
    }
} as const;

export const AccessDomainErrors = {
    OFFICIAL_ROLE_ALREADY_ASSIGNED: {
        codeName: "official_role_already_assigned",
        httpStatusCode: StatusCodes.CONFLICT
    },
    PERMISSION_NOT_GRANTED: {
        codeName: "permission_not_granted",
        httpStatusCode: StatusCodes.FORBIDDEN
    },
    DELEGATED_ROLE_MISSING_EXPIRY: {
        codeName: "delegated_role_missing_expiry",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
    UNKNOWN_PERMISSION: {
        codeName: "unknown_permission",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    UNKNOWN_ROLE: {
        codeName: "unknown_role",
        httpStatusCode: StatusCodes.NOT_FOUND
    },
    ROLE_NOT_ACTIVE: {
        codeName: "role_not_active",
        httpStatusCode: StatusCodes.FORBIDDEN
    },
    INVALID_ROLE_REVOCATION_DATE: {
        codeName: "invalid_role_revocation_date",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
    ROLE_ALREADY_CLOSED: {
        codeName: "role_already_closed",
        httpStatusCode: StatusCodes.CONFLICT
    },
    INVALID_CREDEDNTIALS: {
        codeName: "invalid_request_parameters",
        httpStatusCode: StatusCodes.BAD_REQUEST
    }
} as const;

export const DocumentDomainErrors = {
    INVALID_DOCUMENT_STATE_TRANSITION: {
        codeName: "invalid_document_state",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
    INVALID_OPERATION: {
        codeName: "invalid_operation",
        httpStatusCode: StatusCodes.NOT_ACCEPTABLE
    }
} as const;

export const WorkflowDomainErrors = {
    INVALID_OPERATION: {
        codeName: "invalid_operation",
        httpStatusCode: StatusCodes.NOT_ACCEPTABLE
    },
    INVALID_WORKFLOW_STATE: {
        codeName: "invalid_workflow_state",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
    INVALID_APPROVAL_STATE: {
        codeName: "invalid_approval_state",
        httpStatusCode: StatusCodes.BAD_REQUEST
    },
    EXPIRED_APPROVAL: {
        codeName: "expired_approval",
        httpStatusCode: StatusCodes.GONE
    },
    UNAUTHORISED_APPROVAL: {
        codeName: "unauthorised_approval",
        httpStatusCode: StatusCodes.UNAUTHORIZED
    },
    REJECTION_MINUTE_REQUIRED: {
        codeName: "rejection_minute_required",
        httpStatusCode: StatusCodes.UNAUTHORIZED
    }
} as const;

export const NotificationDomainErrors = {
    INVALID_NOTIFICATION_STATE_TRANSISITION: {
        codeName: "invalid_notification_state_transistion",
        httpStatusCode: StatusCodes.NOT_ACCEPTABLE
    },
} as const;

const GlobalDomainErrors = {
    identity_authority: {
        identity: IdentityDomainErrors,
        access: AccessDomainErrors,
    },
    workflow: WorkflowDomainErrors,
    document: DocumentDomainErrors,
    notifications: NotificationDomainErrors
} as const;

type ValueOf<T> = T[keyof T];

type DomainErrorType =
    | ValueOf<typeof IdentityDomainErrors>
    | ValueOf<typeof AccessDomainErrors>
    | ValueOf<typeof DocumentDomainErrors>
    | ValueOf<typeof WorkflowDomainErrors>
    | ValueOf<typeof NotificationDomainErrors>;

export { GlobalDomainErrors, type DomainErrorType };

