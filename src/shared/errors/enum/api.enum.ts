import { StatusCodes } from "http-status-codes";
import type { ErrorDefinition } from "../model/errorDefinition.model.js";
import { ErrorCategory } from "./errorCategory.enum.js";

export const ApiErrorEnum = {
    NOT_FOUND: {
        codeName: "resource_not_found",
        httpStatusCode: StatusCodes.NOT_FOUND,
        category: ErrorCategory.NOT_FOUND,
        retryable: false,
    },
    BAD_REQUEST: {
        codeName: "invalid_credentials",
        httpStatusCode: StatusCodes.BAD_REQUEST,
        category: ErrorCategory.VALIDATION,
        retryable: false,
    },
    NOT_ALLOWED: {
        codeName: "not_allowed",
        httpStatusCode: StatusCodes.UNAUTHORIZED,
        category: ErrorCategory.AUTHORIZATION,
        retryable: false,
    },
} as const satisfies Record<string, ErrorDefinition>;

export type ApiErrorType = typeof ApiErrorEnum[keyof typeof ApiErrorEnum];
