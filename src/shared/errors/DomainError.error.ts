import type { DomainErrorContext } from "./model/errorContext.model.js";
import type { ErrorDefinition } from "./model/errorDefinition.model.js";
import NexusError from "./NexusError.js";

class DomainError extends NexusError {
	constructor(definition: ErrorDefinition, context: DomainErrorContext) {
		const details: Record<string, unknown> = {
			...context.details,
			...(context.currentState !== undefined
				? { currentState: context.currentState }
				: {}),
			...(context.targetState !== undefined
				? { targetState: context.targetState }
				: {}),
		};
		const detailMessage = context.details?.message;
		const message =
			context.message ??
			(typeof detailMessage === "string"
				? detailMessage
				: definition.codeName);

		super(definition, {
			message,
			...(Object.keys(details).length > 0 ? { details } : {}),
			...(context.cause !== undefined ? { cause: context.cause } : {}),
		});
	}
}

export default DomainError;
