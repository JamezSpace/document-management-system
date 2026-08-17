import type { ApplicationErrorContext } from "./model/errorContext.model.js";
import type { ErrorDefinition } from "./model/errorDefinition.model.js";
import NexusError from "./NexusError.js";

class ApplicationError extends NexusError {
	constructor(definition: ErrorDefinition, context: ApplicationErrorContext) {
		const detailMessage = context.details?.message;
		const message =
			context.message ??
			(typeof detailMessage === "string"
				? detailMessage
				: definition.codeName);

		super(definition, {
			message,
			...(context.details !== undefined
				? { details: context.details }
				: {}),
			...(context.cause !== undefined ? { cause: context.cause } : {}),
		});
	}
}

export default ApplicationError;
