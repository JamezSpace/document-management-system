import { StatusCodes } from "http-status-codes";
import type { ErrorDefinition } from "../model/errorDefinition.model.js";
import { ErrorCategory } from "./errorCategory.enum.js";

enum Category {
	PERSISTENCE = "persistence",
	AUTH = "auth",
    SERVICE = "service"
}

const PersistenceErrors = {
	INVALID_OPERATION: {
		codeName: "invalid_operation",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.INFRASTRUCTURE,
		retryable: false,
	},
	UNIQUE_CONSTRAINT_VIOLATION: {
		codeName: "duplicate_entry",
		httpStatusCode: StatusCodes.CONFLICT,
		category: ErrorCategory.CONFLICT,
		retryable: false,
	},
    NOT_FOUND: {
        codeName: "not_found",
        httpStatusCode: StatusCodes.NOT_FOUND,
		category: ErrorCategory.NOT_FOUND,
		retryable: false,
    },
    INVALID_INPUT_VALUE: {
        codeName: "invalid_input",
        httpStatusCode: StatusCodes.NOT_ACCEPTABLE,
		category: ErrorCategory.VALIDATION,
		retryable: false,
    },
    UNREGISTERED_ERROR: {
        codeName: "unregistered_error",
        httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
		category: ErrorCategory.INFRASTRUCTURE,
		retryable: true,
    }
} as const satisfies Record<string, ErrorDefinition>;

const AuthErrors = {
	ID_TOKEN_INVALID: {
		codeName: "id_token_invalid",
		httpStatusCode: StatusCodes.UNAUTHORIZED,
		category: ErrorCategory.AUTHENTICATION,
		retryable: false,
	},
	INVALID_CREDENTIALS: {
		codeName: "invalid_credentials",
		httpStatusCode: StatusCodes.UNAUTHORIZED,
		category: ErrorCategory.AUTHENTICATION,
		retryable: false,
	},
	EMAIL_ALREADY_EXISTS: {
		codeName: "email_already_exists",
		httpStatusCode: StatusCodes.CONFLICT,
		category: ErrorCategory.CONFLICT,
		retryable: false,
	},
} as const satisfies Record<string, ErrorDefinition>;

const ServiceErrors = {
	JWT_TOKEN_INVALID: {
		codeName: "jwt_token_invalid",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.AUTHENTICATION,
		retryable: false,
	},
	INVALID_TOKEN_FORMAT: {
		codeName: "invalid_token_format",
		httpStatusCode: StatusCodes.BAD_REQUEST,
		category: ErrorCategory.VALIDATION,
		retryable: false,
	},
} as const satisfies Record<string, ErrorDefinition>;

// mapping enum values to their respective error sets
const GlobalInfrastructureErrors = {
	[Category.PERSISTENCE]: PersistenceErrors,
	[Category.AUTH]: AuthErrors,
	[Category.SERVICE]: ServiceErrors,
} as const;

type ValueOf<T> = T[keyof T];
type PersistenceErrorsType = typeof PersistenceErrors;
type InfrastructureErrorType =
	| ValueOf<typeof PersistenceErrors>
	| ValueOf<typeof AuthErrors>
	| ValueOf<typeof ServiceErrors>;

export { GlobalInfrastructureErrors, Category, type PersistenceErrorsType, type InfrastructureErrorType };
