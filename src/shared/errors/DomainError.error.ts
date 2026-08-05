import type { NexusErrorContext } from "./model/errorContext.model.js";
import type { ErrorDefinition } from "./model/errorDefinition.model.js";
import NexusError from "./NexusError.js";

class DomainError extends NexusError {
	constructor(definition: ErrorDefinition, context: NexusErrorContext) {
		super(definition, context);
	}
}

export default DomainError;
