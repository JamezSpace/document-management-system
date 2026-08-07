import { StatusCodes } from "http-status-codes";
import type { ErrorDefinition } from "../model/errorDefinition.model.js";
import { ErrorCategory } from "./errorCategory.enum.js";

export const IdentityDomainErrors = {
	USER_NOT_ACTIVE: {
		codeName: "user_not_active",
		httpStatusCode: StatusCodes.FORBIDDEN,
		category: ErrorCategory.POLICY,
		retryable: false,
	},
	INVALID_STATE_TRANSITION: {
		codeName: "invalid_state_transition",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.WORKFLOW,
		retryable: false,
	},
	INCOMPLETE_REQUEST: {
		codeName: "incomplete_request",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.VALIDATION,
		retryable: false,
	},
} as const satisfies Record<string, ErrorDefinition>;

export const AccessDomainErrors = {
	OFFICIAL_ROLE_ALREADY_ASSIGNED: {
		codeName: "official_role_already_assigned",
		httpStatusCode: StatusCodes.CONFLICT,
		category: ErrorCategory.CONFLICT,
		retryable: false,
	},
	PERMISSION_NOT_GRANTED: {
		codeName: "permission_not_granted",
		httpStatusCode: StatusCodes.FORBIDDEN,
		category: ErrorCategory.AUTHORIZATION,
		retryable: false,
	},
	DELEGATED_ROLE_MISSING_EXPIRY: {
		codeName: "delegated_role_missing_expiry",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.VALIDATION,
		retryable: false,
	},
	UNKNOWN_PERMISSION: {
		codeName: "unknown_permission",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	UNKNOWN_ROLE: {
		codeName: "unknown_role",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	ROLE_NOT_ACTIVE: {
		codeName: "role_not_active",
		httpStatusCode: StatusCodes.FORBIDDEN,
		category: ErrorCategory.POLICY,
		retryable: false,
	},
	INVALID_ROLE_REVOCATION_DATE: {
		codeName: "invalid_role_revocation_date",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.VALIDATION,
		retryable: false,
	},
	ROLE_ALREADY_CLOSED: {
		codeName: "role_already_closed",
		httpStatusCode: StatusCodes.CONFLICT,
		category: ErrorCategory.CONFLICT,
		retryable: false,
	},
	INVALID_CREDEDNTIALS: {
		codeName: "invalid_request_parameters",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.VALIDATION,
		retryable: false,
	},
} as const satisfies Record<string, ErrorDefinition>;

export const DocumentDomainErrors = {
	INVALID_DOCUMENT_STATE_TRANSITION: {
		codeName: "invalid_document_state",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.WORKFLOW,
		retryable: false,
	},
	INVALID_OPERATION: {
		codeName: "invalid_operation",
		httpStatusCode: StatusCodes.NOT_ACCEPTABLE,
		category: ErrorCategory.POLICY,
		retryable: false,
	},
} as const satisfies Record<string, ErrorDefinition>;

export const WorkflowDomainErrors = {
	INVALID_OPERATION: {
		codeName: "invalid_operation",
		httpStatusCode: StatusCodes.NOT_ACCEPTABLE,
		category: ErrorCategory.WORKFLOW,
		retryable: false,
	},
	INVALID_WORKFLOW_STATE: {
		codeName: "invalid_workflow_state",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.WORKFLOW,
		retryable: false,
	},
	UNAUTHORISED_APPROVAL: {
		codeName: "unauthorised_approval",
		httpStatusCode: StatusCodes.FORBIDDEN,
		category: ErrorCategory.AUTHORIZATION,
		retryable: false,
	},
	REJECTION_MINUTE_REQUIRED: {
		codeName: "rejection_minute_required",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.VALIDATION,
		retryable: false,
	},
} as const satisfies Record<string, ErrorDefinition>;

export const NotificationDomainErrors = {
	INVALID_NOTIFICATION_STATE_TRANSISITION: {
		codeName: "invalid_notification_state_transistion",
		httpStatusCode: StatusCodes.NOT_ACCEPTABLE,
		category: ErrorCategory.WORKFLOW,
		retryable: false,
	},
} as const satisfies Record<string, ErrorDefinition>;

const GlobalDomainErrors = {
	identity_authority: {
		identity: IdentityDomainErrors,
		access: AccessDomainErrors,
	},
	workflow: WorkflowDomainErrors,
	document: DocumentDomainErrors,
	notifications: NotificationDomainErrors,
} as const;

type ValueOf<T> = T[keyof T];

type DomainErrorType =
	| ValueOf<typeof IdentityDomainErrors>
	| ValueOf<typeof AccessDomainErrors>
	| ValueOf<typeof DocumentDomainErrors>
	| ValueOf<typeof WorkflowDomainErrors>
	| ValueOf<typeof NotificationDomainErrors>;

export { GlobalDomainErrors, type DomainErrorType };
