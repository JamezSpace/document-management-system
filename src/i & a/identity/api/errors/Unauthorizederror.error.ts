import { StatusCodes } from "http-status-codes";
import type { NexusAppError } from "../../../../shared/errors/model/nexusAppError.model.js";

class UnauthorizedError implements NexusAppError {
	httpStatusCode = StatusCodes.UNAUTHORIZED;

	// this is just a string containing the operation e.g AUTH_001
	errorCode!: string;

	errorMessage!: string;

	details?: Record<string, any>;

	constructor(error: {
		errorCode: string;
		errorMessage: string;
		details?: Record<string, any>;
	}) {
		this.errorCode = error.errorCode;
		this.errorMessage = error.errorMessage;

		if (error.details) this.details = error.details;
	}
}

export default UnauthorizedError;
