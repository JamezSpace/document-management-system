import { StatusCodes } from "http-status-codes";
import type { ErrorDefinition } from "../model/errorDefinition.model.js";
import { ErrorCategory } from "./errorCategory.enum.js";

export const ApplicationErrorEnum = {
	INVALID_CREDENTIALS: {
		codeName: "invalid_credentials",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.AUTHENTICATION,
		retryable: false,
	},
	INCOMPLETE_REQUEST: {
		codeName: "incomplete_request",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.VALIDATION,
		retryable: false,
	},
	ROLE_NOT_FOUND: {
		codeName: "role_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	IDENTITY_NOT_FOUND: {
		codeName: "identity_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	INVITE_NOT_FOUND: {
		codeName: "invite_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	SESSION_NOT_FOUND: {
		codeName: "session_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	STAFF_NOT_FOUND: {
		codeName: "staff_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	DESIGNATION_NOT_FOUND: {
		codeName: "designation_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	CAPABILITY_CLASS_NOT_FOUND: {
		codeName: "capability_class_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND   ,
		retryable: false,
	},
	APPROVER_NOT_FOUND: {
		codeName: "approver_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	TASK_NOT_FOUND: {
		codeName: "task_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	WRKFLOW_NOT_FOUND: {
		codeName: "workflow_instance_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	MEDIA_NOT_FOUND: {
		codeName: "media_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	DOCUMENT_NOT_FOUND: {
		codeName: "document_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	MINUTE_NOT_FOUND: {
		codeName: "minute_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	POLICY_NOT_FOUND: {
		codeName: "policy_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	REGISTRY_RESOURCE_NOT_FOUND: {
		codeName: "registry_resource_not_found",
		httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
	},
	CONFLICT: {
		codeName: "conflict",
		httpStatusCode: StatusCodes.CONFLICT,
		category: ErrorCategory.CONFLICT,
		retryable: false,
	},
	GRANT_EXPIRED: {
		codeName: "governance_grant_expired",
		httpStatusCode: StatusCodes.GONE,
		category: ErrorCategory.AUTHORIZATION,
		retryable: false,
	},
	GRANT_EXHAUSTED: {
		codeName: "governance_grant_exhausted",
		httpStatusCode: StatusCodes.CONFLICT,
		category: ErrorCategory.AUTHORIZATION,
		retryable: false,
	},
	GRANT_REVOKED: {
		codeName: "governance_grant_revoked",
		httpStatusCode: StatusCodes.GONE,
		category: ErrorCategory.AUTHORIZATION,
		retryable: false,
	},
	INVALID_DELEGATE: {
		codeName: "invalid_governance_delegate",
		httpStatusCode: StatusCodes.FORBIDDEN,
		category: ErrorCategory.AUTHORIZATION,
		retryable: false,
	},
	STALE_GOVERNANCE_DECISION: {
		codeName: "stale_governance_decision",
		httpStatusCode: StatusCodes.CONFLICT,
		category: ErrorCategory.CONFLICT,
		retryable: true,
	},
	USER_NOT_AUTHENTICATED: {
		codeName: "user_not_authenticated",
		httpStatusCode: StatusCodes.UNAUTHORIZED,
		category: ErrorCategory.AUTHENTICATION,
		retryable: false,
	},
	USER_NOT_AUTHORIZED: {
		codeName: "user_not_authorized",
		httpStatusCode: StatusCodes.FORBIDDEN,
		category: ErrorCategory.AUTHORIZATION,
		retryable: false,
	},
	NOT_ALLOWED: {
		codeName: "not_allowed",
		httpStatusCode: StatusCodes.FORBIDDEN,
		category: ErrorCategory.AUTHORIZATION,
		retryable: false,
	},
} as const satisfies Record<string, ErrorDefinition>;

export type ApplicationErrorType =
	(typeof ApplicationErrorEnum)[keyof typeof ApplicationErrorEnum];
