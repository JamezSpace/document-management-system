import type { InfrastructureErrorContext } from "./model/errorContext.model.js";
import type { ErrorDefinition } from "./model/errorDefinition.model.js";
import NexusError from "./NexusError.js";

class InfrastructureError extends NexusError {
	constructor(
		definition: ErrorDefinition,
		context: InfrastructureErrorContext,
	) {
		const details: Record<string, unknown> = {
			...context.details,
			category: context.category,
			...(context.table !== undefined ? { table: context.table } : {}),
			...(context.column !== undefined ? { column: context.column } : {}),
		};

		super(definition, {
			message: context.message,
			details,
			...(context.cause !== undefined ? { cause: context.cause } : {}),
		});
	}
}

export default InfrastructureError;
