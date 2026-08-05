import type { StatusCodes } from "http-status-codes";
import type { ErrorCategory } from "../enum/errorCategory.enum.js";

interface ErrorDefinition {
	codeName: string;
	httpStatusCode: StatusCodes;
	category: ErrorCategory;
	retryable?: boolean;
}

export type { ErrorDefinition };